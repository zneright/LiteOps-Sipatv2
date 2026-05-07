<?php
namespace App\Controllers;

use CodeIgniter\RESTful\ResourceController;

class LogController extends ResourceController
{
    public function __construct() {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Headers: *');
        header('Access-Control-Allow-Methods: *');
    }

    public function index() {
        if ($this->request->getMethod(true) === 'OPTIONS') return $this->response->setStatusCode(200);

        try {
            $db = \Config\Database::connect();
            $logs = $db->table('system_logs')->orderBy('created_at', 'DESC')->get()->getResultArray();
            return $this->respond($logs);
        } catch (\Exception $e) {
            return $this->failServerError('DB Error: ' . $e->getMessage());
        }
    }

    public function create() {
        if ($this->request->getMethod(true) === 'OPTIONS') return $this->response->setStatusCode(200);
        $json = $this->request->getJSON();

        if (!$json || empty($json->actor_email)) return $this->fail('Invalid payload');

        try {
            $db = \Config\Database::connect();
            
            $user = $db->table('users')->where('email', $json->actor_email)->get()->getRowArray();
            $realName = $user ? ($user['full_name'] ?: $user['organization_name']) : 'Unknown User';
            $role = $user ? $user['role'] : 'unknown';

            $db->table('system_logs')->insert([
                'actor_email' => $json->actor_email,
                'actor_name'  => $realName,
                'actor_role'  => $role,
                'action_type' => $json->action_type ?? 'SYSTEM',
                'description' => $json->description ?? 'Performed an action',
                'created_at'  => date('Y-m-d H:i:s')
            ]);

            return $this->respondCreated(['message' => 'Log recorded']);
        } catch (\Exception $e) {
            return $this->failServerError('DB Error: ' . $e->getMessage());
        }
    }
}