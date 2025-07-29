#!/usr/bin/env node

/**
 * 統合スキーマ移行スクリプト
 * 
 * 既存のSupabaseデータをバックアップし、新しい統合スキーマに移行します。
 * 
 * 実行手順:
 * 1. 既存データのバックアップ
 * 2. 新スキーマの適用
 * 3. データ移行実行
 * 4. 検証・ロールバック準備
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

class UnifiedSchemaMigrator {
  constructor() {
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error('Supabase環境変数が設定されていません');
    }
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    this.backupDir = path.join(process.cwd(), 'backup', `migration-${Date.now()}`);
    this.migrationReport = {
      startTime: new Date().toISOString(),
      backups: [],
      migrations: [],
      errors: [],
      summary: {}
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const colors = {
      info: '\x1b[34m',      // blue
      success: '\x1b[32m',   // green  
      warning: '\x1b[33m',   // yellow
      error: '\x1b[31m',     // red
      header: '\x1b[36m\x1b[1m' // cyan bold
    };
    const reset = '\x1b[0m';
    const gray = '\x1b[90m';
    
    console.log(`${gray}${timestamp}${reset} 🔄 Migrate: ${colors[type]}${message}${reset}`);
  }

  async createBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
    this.log(`バックアップディレクトリ作成: ${this.backupDir}`, 'info');
  }

  async backupExistingData() {
    this.log('既存データのバックアップ開始...', 'header');
    await this.createBackupDirectory();

    const tables = ['programs', 'episodes'];
    
    for (const table of tables) {
      try {
        this.log(`${table}テーブルをバックアップ中...`, 'info');
        
        const { data, error } = await this.supabase
          .from(table)
          .select('*');
        
        if (error) {
          this.log(`${table}バックアップエラー: ${error.message}`, 'warning');
          this.migrationReport.errors.push({
            table,
            operation: 'backup',
            error: error.message
          });
          continue;
        }

        const backupFile = path.join(this.backupDir, `${table}_backup.json`);
        fs.writeFileSync(backupFile, JSON.stringify(data, null, 2), 'utf8');
        
        this.migrationReport.backups.push({
          table,
          recordCount: data.length,
          backupFile,
          timestamp: new Date().toISOString()
        });
        
        this.log(`✅ ${table}: ${data.length}件バックアップ完了`, 'success');
      } catch (error) {
        this.log(`${table}バックアップ失敗: ${error.message}`, 'error');
        this.migrationReport.errors.push({
          table,
          operation: 'backup',
          error: error.message
        });
      }
    }
  }

  async runMigrations() {
    this.log('新スキーママイグレーション実行...', 'header');
    
    const migrationFiles = [
      '20250129000001_unified_clean_schema.sql',
      '20250129000002_initial_data_setup.sql'
    ];

    for (const filename of migrationFiles) {
      try {
        this.log(`マイグレーション実行: ${filename}`, 'info');
        
        const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', filename);
        
        if (!fs.existsSync(migrationPath)) {
          throw new Error(`マイグレーションファイルが見つかりません: ${migrationPath}`);
        }

        const sql = fs.readFileSync(migrationPath, 'utf8');
        
        // SQLをセクションごとに分割して実行
        const sections = sql.split('-- =========================================');
        
        for (let i = 0; i < sections.length; i++) {
          const section = sections[i].trim();
          if (!section) continue;
          
          try {
            const { error } = await this.supabase.rpc('exec_sql', { sql_query: section });
            
            if (error) {
              this.log(`セクション${i + 1}実行エラー: ${error.message}`, 'warning');
              // 一部のエラーは無視して続行（テーブルが既に存在する場合など）
              if (!error.message.includes('already exists')) {
                throw error;
              }
            }
          } catch (sectionError) {
            this.log(`セクション${i + 1}スキップ: ${sectionError.message}`, 'warning');
          }
        }
        
        this.migrationReport.migrations.push({
          filename,
          status: 'completed',
          timestamp: new Date().toISOString()
        });
        
        this.log(`✅ ${filename} 完了`, 'success');
        
      } catch (error) {
        this.log(`❌ ${filename} 失敗: ${error.message}`, 'error');
        this.migrationReport.migrations.push({
          filename,
          status: 'failed',
          error: error.message,
          timestamp: new Date().toISOString()
        });
        this.migrationReport.errors.push({
          file: filename,
          operation: 'migration',
          error: error.message
        });
      }
    }
  }

  async migrateExistingData() {
    this.log('既存データの移行開始...', 'header');
    
    try {
      // バックアップデータの読み込み
      const backupFiles = this.migrationReport.backups;
      let migratedCount = 0;
      
      for (const backup of backupFiles) {
        if (backup.table === 'programs') {
          await this.migrateProgramsData(backup);
          migratedCount++;
        }
        
        if (backup.table === 'episodes') {
          await this.migrateEpisodesData(backup);
          migratedCount++;
        }
      }
      
      this.migrationReport.summary.migratedTables = migratedCount;
      this.log(`✅ ${migratedCount}テーブルのデータ移行完了`, 'success');
      
    } catch (error) {
      this.log(`データ移行エラー: ${error.message}`, 'error');
      this.migrationReport.errors.push({
        operation: 'data_migration',
        error: error.message
      });
    }
  }

  async migrateProgramsData(backup) {
    this.log('programsデータ移行中...', 'info');
    
    if (!fs.existsSync(backup.backupFile)) {
      this.log('programsバックアップファイルが見つかりません', 'warning');
      return;
    }

    const programs = JSON.parse(fs.readFileSync(backup.backupFile, 'utf8'));
    
    for (const program of programs) {
      try {
        // 既存programsテーブルから新しいepisodesテーブルへの移行
        // 既存の構造では programs が実際にはエピソードデータだった
        const episodeData = {
          program_id: program.source_system === 'platto' ? 
            (await this.getOrCreateProgram('platto')).id :
            (await this.getOrCreateProgram('liberary')).id,
          episode_number: program.id,
          title: program.title || `エピソード ${program.id}`,
          subtitle: program.subtitle,
          current_stage: this.mapOldStatusToNewStage(program.status, program.source_system),
          planned_air_date: program.first_air_date,
          actual_air_date: program.re_air_date || program.complete_date,
          recording_date: program.filming_date,
          director: program.director,
          script_url: program.script_url,
          notes: program.notes,
          // システム固有データの保存
          platto_data: program.source_system === 'platto' ? {
            cast1: program.cast1,
            cast2: program.cast2,
            pr_text: program.pr_text,
            pr_completed: program.pr_completed,
            pr_due_date: program.pr_due_date,
            pr_80text: program.pr_80text,
            pr_200text: program.pr_200text
          } : {},
          liberary_data: program.source_system === 'liberary' ? {
            interview_guest: program.interview_guest
          } : {},
          metadata: {
            migrated_from: 'legacy_programs',
            legacy_id: program.id,
            migrated_at: new Date().toISOString()
          },
          created_by: 'migration_script',
          status: 'active'
        };

        const { error } = await this.supabase
          .from('episodes')
          .insert(episodeData);

        if (error) {
          this.log(`エピソード移行エラー (ID: ${program.id}): ${error.message}`, 'warning');
        }
        
      } catch (error) {
        this.log(`プログラム移行エラー (ID: ${program.id}): ${error.message}`, 'warning');
      }
    }
  }

  async migrateEpisodesData(backup) {
    this.log('episodesデータ移行中...', 'info');
    
    if (!fs.existsSync(backup.backupFile)) {
      this.log('episodesバックアップファイルが見つかりません', 'warning');
      return;
    }

    const episodes = JSON.parse(fs.readFileSync(backup.backupFile, 'utf8'));
    
    for (const episode of episodes) {
      try {
        // 既存episodesデータの移行（もし存在する場合）
        const episodeData = {
          program_id: (await this.getOrCreateProgram('liberary')).id, // episodesは主にliberary用
          episode_number: episode.episode_number || episode.id,
          title: episode.title || `エピソード ${episode.id}`,
          current_stage: this.mapOldStatusToNewStage(episode.current_status, 'liberary'),
          recording_date: episode.recording_date,
          director: episode.director,
          notes: episode.notes,
          liberary_data: {
            interview_guest: episode.interview_guest,
            season: episode.season
          },
          metadata: {
            migrated_from: 'legacy_episodes',
            legacy_id: episode.id,
            migrated_at: new Date().toISOString()
          },
          created_by: 'migration_script',
          status: 'active'
        };

        const { error } = await this.supabase
          .from('episodes')
          .insert(episodeData);

        if (error) {
          this.log(`エピソード移行エラー (ID: ${episode.id}): ${error.message}`, 'warning');
        }
        
      } catch (error) {
        this.log(`エピソード移行エラー (ID: ${episode.id}): ${error.message}`, 'warning');
      }
    }
  }

  async getOrCreateProgram(slug) {
    // 既に作成されたプログラムを取得
    const { data, error } = await this.supabase
      .from('programs')
      .select('id')
      .eq('slug', slug)
      .single();
    
    if (error || !data) {
      throw new Error(`プログラム ${slug} が見つかりません。初期データが正しく作成されているか確認してください。`);
    }
    
    return data;
  }

  mapOldStatusToNewStage(oldStatus, system) {
    const mapping = {
      platto: {
        'キャスティング中': 'casting',
        'シナリオ制作中': 'scenario',
        '収録準備中': 'recording_prep',
        '収録済': 'recorded',
        '編集中': 'editing',
        '確認中': 'review',
        '承認済': 'approved',
        '納品済': 'delivered',
        '請求済': 'billed'
      },
      liberary: {
        '企画中': 'planning',
        '台本作成中': 'script_writing',
        'キャスティング中': 'casting',
        'ロケハン中': 'location',
        '撮影中': 'shooting',
        '編集中': 'editing',
        '確認中': 'review',
        '承認済': 'approved',
        '公開済': 'published',
        '完パケ納品': 'delivered'
      }
    };

    return mapping[system]?.[oldStatus] || (system === 'platto' ? 'casting' : 'planning');
  }

  async validateMigration() {
    this.log('移行結果の検証中...', 'header');
    
    try {
      const { data: programs, error: programsError } = await this.supabase
        .from('programs')
        .select('*');
      
      const { data: episodes, error: episodesError } = await this.supabase
        .from('episodes')
        .select('*');

      if (programsError || episodesError) {
        throw new Error('検証クエリエラー');
      }

      this.migrationReport.summary = {
        ...this.migrationReport.summary,
        finalProgramsCount: programs.length,
        finalEpisodesCount: episodes.length,
        migrationCompleted: true
      };

      this.log(`✅ 検証完了 - Programs: ${programs.length}, Episodes: ${episodes.length}`, 'success');
      
    } catch (error) {
      this.log(`❌ 検証エラー: ${error.message}`, 'error');
      this.migrationReport.errors.push({
        operation: 'validation',
        error: error.message
      });
    }
  }

  async generateReport() {
    this.migrationReport.endTime = new Date().toISOString();
    this.migrationReport.duration = new Date(this.migrationReport.endTime) - new Date(this.migrationReport.startTime);
    
    const reportFile = path.join(this.backupDir, 'migration_report.json');
    fs.writeFileSync(reportFile, JSON.stringify(this.migrationReport, null, 2), 'utf8');
    
    this.log(`📊 移行レポート作成: ${reportFile}`, 'info');
    
    // サマリー表示
    console.log('\n' + '='.repeat(60));
    this.log('移行完了サマリー', 'header');
    console.log('='.repeat(60));
    
    this.log(`実行時間: ${Math.round(this.migrationReport.duration / 1000)}秒`, 'info');
    this.log(`バックアップ: ${this.migrationReport.backups.length}テーブル`, 'info');
    this.log(`マイグレーション: ${this.migrationReport.migrations.length}ファイル`, 'info');
    this.log(`エラー: ${this.migrationReport.errors.length}件`, this.migrationReport.errors.length > 0 ? 'warning' : 'success');
    
    if (this.migrationReport.summary.migrationCompleted) {
      this.log('🎉 統合スキーマ移行が完了しました！', 'success');
    } else {
      this.log('⚠️ 移行中にエラーが発生しました。レポートを確認してください。', 'warning');
    }
    
    console.log('='.repeat(60) + '\n');
  }

  async run() {
    try {
      this.log('DELAxPM統合スキーマ移行開始...', 'header');
      
      await this.backupExistingData();
      await this.runMigrations();
      await this.migrateExistingData();
      await this.validateMigration();
      await this.generateReport();
      
    } catch (error) {
      this.log(`❌ 移行失敗: ${error.message}`, 'error');
      console.error('詳細エラー:', error);
      process.exit(1);
    }
  }
}

// CLI実行
if (require.main === module) {
  // 環境変数チェック
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL環境変数が設定されていません');
    process.exit(1);
  }

  const migrator = new UnifiedSchemaMigrator();
  migrator.run().catch(error => {
    console.error('移行スクリプトエラー:', error);
    process.exit(1);
  });
}

module.exports = UnifiedSchemaMigrator;