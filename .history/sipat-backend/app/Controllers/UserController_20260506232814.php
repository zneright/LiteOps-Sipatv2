<?php
namespace App\Controllers;

use App\Controllers\BaseController;
use CodeIgniter\API\ResponseTrait;

class UserController extends BaseController
{
    use ResponseTrait;

    public function create()
    {
        // 1. Hardcore CORS Headers
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE');
        
        if ($this->request->getMethod(true) === 'OPTIONS') {
            return $this->response->setStatusCode(200);
        }

        $json = $this->request->getJSON();
        if (!$json) return $this->fail('No JSON data provided', 400);

        // 2. CRASH-CATCHER BLOCK
        try {
            $db = \Config\Database::connect();
            $builder = $db->table('users');
            
            $data = [
                'firebase_uid'      => $json->firebase_uid,
                'email'             => $json->email,
                'full_name'         => $json->full_name,
                'role'              => $json->role,
                'organization_name' => $json->organization_name,
                'is_approved'       => $json->is_approved,
                'created_at'        => date('Y-m-d H:i:s')
            ];

            if ($builder->insert($data)) {
                return $this->respondCreated(['status' => 201, 'message' => 'User saved to DB']);
            }

            return $this->failServerError('Failed to save user.');

        } catch (\Exception $e) {
            // IF MYSQL CRASHES, IT WILL SEND THE EXACT ERROR TO REACT
            return $this->failServerError('DB Error: ' . $e->getMessage());
        }
    }

    public function index()
    {
        header('Access-Control-Allow-Origin: *');
        try {
            $db = \Config\Database::connect();
            $builder = $db->table('users');
            
            // --- THE FIX: Filter by firebase_uid if React sends one ---
            $uid = $this->request->getVar('firebase_uid');
            if ($uid) {
                $builder->where('firebase_uid', $uid);
            }
            // ----------------------------------------------------------

            $users = $builder->orderBy('created_at', 'DESC')->get()->getResultArray();
            return $this->respond($users);
            
        } catch (\Exception $e) {
            return $this->failServerError('DB Error: ' . $e->getMessage());
        }
    }
    public function updateProfile($uid = null)
{
    // Ensure CORS
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');

    if ($this->request->getMethod(true) === 'OPTIONS') return $this->response->setStatusCode(200);

    $json = $this->request->getJSON();
    if (!$json) return $this->fail('No data provided');

    $db = \Config\Database::connect();
    
    // 🚀 Update logic
    $updated = $db->table('users')
                  ->where('firebase_uid', $uid)
                  ->update([
                      'location' => $json->location ?? null,
                      'bio'      => $json->bio ?? null
                  ]);

    if ($updated) {
        return $this->respond(['message' => 'Profile Updated Successfully']);
    }
    return $this->failServerError('Update failed. Check if UID exists.');
}
}