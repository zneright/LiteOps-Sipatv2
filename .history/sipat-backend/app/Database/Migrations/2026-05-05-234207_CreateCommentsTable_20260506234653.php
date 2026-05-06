<?php

namespace App\Database\Migrations;
use CodeIgniter\Database\Migration;

class CreateCommentsTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id'             => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
            'project_id'     => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
            'parent_id'      => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'null' => true], // 🚀 FIX: Added for replies
            'user_email'     => ['type' => 'VARCHAR', 'constraint' => '150'], // 🚀 FIX: Added to link comments to users
            'target_phase'   => ['type' => 'VARCHAR', 'constraint' => '255', 'null' => true],
            'author_name'    => ['type' => 'VARCHAR', 'constraint' => '100', 'default' => 'Anonymous'],
            'text_content'   => ['type' => 'TEXT'],
            'image_url'      => ['type' => 'VARCHAR', 'constraint' => '255', 'null' => true],
            'ai_match_score' => ['type' => 'INT', 'constraint' => 3, 'default' => 0],
            'is_ghost_alert' => ['type' => 'BOOLEAN', 'default' => false],
            'likes'          => ['type' => 'INT', 'default' => 0],
            'unlikes'        => ['type' => 'INT', 'default' => 0],
            'neutrals'       => ['type' => 'INT', 'default' => 0],
            'created_at'     => ['type' => 'DATETIME', 'null' => true],
        ]);
        
        $this->forge->addKey('id', true);
        $this->forge->createTable('comments');
    }

    public function down() 
    { 
        $this->forge->dropTable('comments'); 
    }
}