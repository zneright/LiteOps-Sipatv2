<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateProjectsTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id'              => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
            'title'           => ['type' => 'VARCHAR', 'constraint' => '255'],
            'category'        => ['type' => 'VARCHAR', 'constraint' => '100'],
            'budget'          => ['type' => 'VARCHAR', 'constraint' => '100', 'null' => true],
            'description'     => ['type' => 'TEXT'],
            'keywords'        => ['type' => 'VARCHAR', 'constraint' => '255', 'null' => true], // 🚀 NEW
            'start_date'      => ['type' => 'DATE', 'null' => true], // 🚀 NEW
            'completion_date' => ['type' => 'DATE', 'null' => true], // 🚀 NEW
            'ai_summary'      => ['type' => 'TEXT', 'null' => true],
            'phases'          => ['type' => 'TEXT', 'null' => true],
            'file_url'        => ['type' => 'VARCHAR', 'constraint' => '255', 'null' => true],
            'file_type'       => ['type' => 'VARCHAR', 'constraint' => '100', 'null' => true],
            'created_at'      => ['type' => 'DATETIME', 'null' => true],
        ]);
        
        $this->forge->addKey('id', true);
        $this->forge->createTable('projects');
    }

    public function down()
    {
        $this->forge->dropTable('projects');
    }
}