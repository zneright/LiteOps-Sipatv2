<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateUsersTable extends Migration
{
   public function up()
{
    $this->forge->addField([
        'id'                => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
        'firebase_uid'      => ['type' => 'VARCHAR', 'constraint' => '100', 'unique' => true],
        'email'             => ['type' => 'VARCHAR', 'constraint' => '150'],
        'full_name'         => ['type' => 'VARCHAR', 'constraint' => '100'],
        'role'              => ['type' => 'ENUM', 'constraint' => ['citizen', 'agency', 'admin'], 'default' => 'citizen'],
        'organization_name' => ['type' => 'VARCHAR', 'constraint' => '255', 'null' => true],
        'is_approved'       => ['type' => 'TINYINT', 'constraint' => 1, 'default' => 0], // 0 = False, 1 = True
        'created_at'        => ['type' => 'DATETIME', 'null' => true],
        'location'          => ['type' => 'VARCHAR', 'constraint' => '255', 'null' => true],
        'bio'               => ['type' => 'TEXT', 'null' => true],
        'is_approved'       => ['type' => 'TINYINT', 'constraint' => 1, 'default' => 0], // 0 = False, 1 = True
        'created_at'        => ['type' => 'DATETIME', 'null' => true],
        ]);
    $this->forge->addKey('id', true);
    $this->forge->createTable('users');
}

    public function down()
    {
        //
    }
}
