<?php
namespace App\Controllers;

use App\Controllers\BaseController;
use CodeIgniter\API\ResponseTrait;

class UserController extends BaseController
{
    use ResponseTrait;

    public function create()
    {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE');
        if ($this->request->getMethod(true) === 'OPTIONS') return $this->response->setStatusCode(200);

        $json = $this->request->getJSON();
        if (!$json) return $this->fail('No JSON data provided', 400);

        try {
            $db = \Config\Database::connect();
            $data = [
                'firebase_uid'      => $json->firebase_uid,
                'email'             => $json->email,
                'full_name'         => $json->full_name,
                'role'              => $json->role,
                'organization_name' => $json->organization_name,
                'is_approved'       => $json->is_approved,
                'created_at'        => date('Y-m-d H:i:s')
            ];

            if ($db->table('users')->insert($data)) {
                $db->table('system_logs')->insert([
                    'actor_email' => $json->email,
                    'actor_name'  => $json->role === 'agency' ? $json->organization_name : $json->full_name,
                    'actor_role'  => $json->role,
                    'action_type' => 'REGISTER',
                    'description' => "Registered a new {$json->role} account.",
                    'created_at'  => date('Y-m-d H:i:s')
                ]);
                return $this->respondCreated(['status' => 201, 'message' => 'User saved to DB']);
            }
            return $this->failServerError('Failed to save user.');
        } catch (\Exception $e) {
            return $this->failServerError('DB Error: ' . $e->getMessage());
        }
    }

    public function index()
    {
        header('Access-Control-Allow-Origin: *');
        try {
            $db = \Config\Database::connect();
            $builder = $db->table('users');
            if ($uid = $this->request->getVar('firebase_uid')) $builder->where('firebase_uid', $uid);
            if ($email = $this->request->getVar('email')) $builder->where('email', $email);
            return $this->respond($builder->orderBy('created_at', 'DESC')->get()->getResultArray());
        } catch (\Exception $e) {
            return $this->failServerError('DB Error: ' . $e->getMessage());
        }
    }

    public function update($firebase_uid = null)
    {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE');
        if ($this->request->getMethod(true) === 'OPTIONS') return $this->response->setStatusCode(200);

        $json = $this->request->getJSON();
        if (!$json) return $this->fail('No JSON data provided', 400);

        try {
            $db = \Config\Database::connect();
            $data = [];
            if (isset($json->organization_name)) $data['organization_name'] = $json->organization_name;
            if (isset($json->contact_email)) $data['email'] = $json->contact_email;
            if (isset($json->location)) $data['location'] = $json->location;
            if (isset($json->bio)) $data['bio'] = $json->bio;
            if (isset($json->is_approved)) $data['is_approved'] = $json->is_approved;

            if (empty($data)) return $this->fail('No valid data to update');

            if ($db->table('users')->where('firebase_uid', $firebase_uid)->update($data)) {
                $db->table('system_logs')->insert([
                    'actor_email' => $json->contact_email ?? 'system',
                    'actor_name'  => $json->organization_name ?? 'User',
                    'actor_role'  => 'system',
                    'action_type' => 'PROFILE UPDATE',
                    'description' => "Updated profile information.",
                    'created_at'  => date('Y-m-d H:i:s')
                ]);
                return $this->respond(['status' => 200, 'message' => 'Profile updated']);
            }
            return $this->failServerError('Failed to update profile.');
        } catch (\Exception $e) {
            return $this->failServerError('DB Error: ' . $e->getMessage());
        }
    }

    public function getSavedProjects() {
        header('Access-Control-Allow-Origin: *');
        $email = $this->request->getVar('email');
        if (!$email) return $this->fail('Missing email');

        $db = \Config\Database::connect();
        $user = $db->table('users')->where('email', $email)->get()->getRowArray();
        $saved = ($user && $user['saved_projects']) ? json_decode($user['saved_projects'], true) : [];
        return $this->respond(['saved_projects' => is_array($saved) ? $saved : []]);
    }

    public function toggleSaveProject() {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE');
        if ($this->request->getMethod(true) === 'OPTIONS') return $this->response->setStatusCode(200);

        $json = $this->request->getJSON();
        if (!$json->email || !$json->project_id) return $this->fail('Missing data');

        $db = \Config\Database::connect();
        $user = $db->table('users')->where('email', $json->email)->get()->getRowArray();
        if (!$user) return $this->fail('User not found');

        $saved = $user['saved_projects'] ? json_decode($user['saved_projects'], true) : [];
        if (!is_array($saved)) $saved = [];

        if (in_array($json->project_id, $saved)) {
            $saved = array_values(array_diff($saved, [$json->project_id])); 
            $status = 'removed';
            $desc = "Removed bookmark for Project #{$json->project_id}";
        } else {
            $saved[] = $json->project_id;
            $status = 'added';
            $desc = "Bookmarked Project #{$json->project_id}";
        }

        $db->table('users')->where('email', $json->email)->update(['saved_projects' => json_encode($saved)]);
        $db->table('system_logs')->insert(['actor_email' => $json->email, 'actor_name' => $user['full_name'] ?: $user['organization_name'], 'actor_role' => $user['role'], 'action_type' => 'BOOKMARK', 'description' => $desc, 'created_at' => date('Y-m-d H:i:s')]);

        return $this->respond(['status' => 200, 'action' => $status, 'saved_projects' => $saved]);
    }

    public function getFollowedAgencies() {
        header('Access-Control-Allow-Origin: *');
        $email = $this->request->getVar('email');
        if (!$email) return $this->fail('Missing email');

        $db = \Config\Database::connect();
        $user = $db->table('users')->where('email', $email)->get()->getRowArray();
        $followed = ($user && $user['followed_agencies']) ? json_decode($user['followed_agencies'], true) : [];
        return $this->respond(['followed_agencies' => is_array($followed) ? $followed : []]);
    }

    public function toggleFollowAgency() {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE');
        if ($this->request->getMethod(true) === 'OPTIONS') return $this->response->setStatusCode(200);

        $json = $this->request->getJSON();
        if (!$json->email || !$json->agency_name) return $this->fail('Missing data');

        $db = \Config\Database::connect();
        $user = $db->table('users')->where('email', $json->email)->get()->getRowArray();
        if (!$user) return $this->fail('User not found');

        $followed = $user['followed_agencies'] ? json_decode($user['followed_agencies'], true) : [];
        if (!is_array($followed)) $followed = [];

        if (in_array($json->agency_name, $followed)) {
            $followed = array_values(array_diff($followed, [$json->agency_name])); 
            $status = 'unfollowed';
            $desc = "Unfollowed agency '{$json->agency_name}'";
        } else {
            $followed[] = $json->agency_name; 
            $status = 'followed';
            $desc = "Followed agency '{$json->agency_name}'";
        }

        $db->table('users')->where('email', $json->email)->update(['followed_agencies' => json_encode($followed)]);
        $db->table('system_logs')->insert(['actor_email' => $json->email, 'actor_name' => $user['full_name'] ?: $user['organization_name'], 'actor_role' => $user['role'], 'action_type' => 'FOLLOW', 'description' => $desc, 'created_at' => date('Y-m-d H:i:s')]);

        return $this->respond(['status' => 200, 'action' => $status, 'followed_agencies' => $followed]);
    }

    public function toggleStatus() {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE');
        if ($this->request->getMethod(true) === 'OPTIONS') return $this->response->setStatusCode(200);

        $json = $this->request->getJSON();
        if (!$json->firebase_uid) return $this->fail('Missing user ID');

        try {
            $db = \Config\Database::connect();
            $db->table('users')->where('firebase_uid', $json->firebase_uid)->update(['is_active' => $json->is_active]);
            
            $db->table('system_logs')->insert([
                'actor_email' => 'admin@sipat.com',
                'actor_name'  => 'Super Admin',
                'actor_role'  => 'admin',
                'action_type' => 'SECURITY',
                'description' => "Changed active status for UID '{$json->firebase_uid}' to {$json->is_active}.",
                'created_at'  => date('Y-m-d H:i:s')
            ]);
            return $this->respond(['status' => 200, 'message' => '']);
        } catch (\Exception $e) {
            return $this->failServerError('DB Error: ' . $e->getMessage());
        }
    }
}   