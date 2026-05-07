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
        
        if ($this->request->getMethod(true) === 'OPTIONS') {
            return $this->response->setStatusCode(200);
        }

        $json = $this->request->getJSON();
        if (!$json) return $this->fail('No JSON data provided', 400);

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
            if ($db->table('users')->insert($data)) {
                // 🚀 MASTER LOG: REGISTRATION
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
            
            $uid = $this->request->getVar('firebase_uid');
            if ($uid) {
                $builder->where('firebase_uid', $uid);
            }

            // 🚀 THE FIX: Allow React to search by email!
            $email = $this->request->getVar('email');
            if ($email) {
                $builder->where('email', $email);
            }

            $users = $builder->orderBy('created_at', 'DESC')->get()->getResultArray();
            return $this->respond($users);
            
        } catch (\Exception $e) {
            return $this->failServerError('DB Error: ' . $e->getMessage());
        }
    }
    // 🚀 NEW: Update user profile details
    public function update($firebase_uid = null)
    {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE');

        if ($this->request->getMethod(true) === 'OPTIONS') {
            return $this->response->setStatusCode(200);
        }

        $json = $this->request->getJSON();
        if (!$json) return $this->fail('No JSON data provided', 400);

        try {
            $db = \Config\Database::connect();
            $builder = $db->table('users');
            
            // Look up the user by their Firebase UID
            $builder->where('firebase_uid', $firebase_uid);
            $data = [];
            if (isset($json->organization_name)) $data['organization_name'] = $json->organization_name;
            if (isset($json->contact_email)) $data['email'] = $json->contact_email;
            if (isset($json->location)) $data['location'] = $json->location;
            if (isset($json->bio)) $data['bio'] = $json->bio;
            
            // 🚀 NEW: Allow Admin to Verify/Approve Agencies
            if (isset($json->is_approved)) $data['is_approved'] = $json->is_approved;

            if (empty($data)) return $this->fail('No valid data to update');

            if ($builder->update($data)) {
                return $this->respond(['status' => 200, 'message' => 'Profile/Status updated successfully']);
            }
            if ($db->table('users')->insert($data)) {
                // 🚀 MASTER LOG: REGISTRATION
                $db->table('system_logs')->insert([
                    'actor_email' => $json->email,
                    'actor_name'  => $json->role === 'agency' ? $json->organization_name : $json->full_name,
                    'actor_role'  => $json->role,
                    'action_type' => 'UPDATE',
                    'description' => "Updated profile for {$json->role} account.",
                    'created_at'  => date('Y-m-d H:i:s')
                ]);
                return $this->respondCreated(['status' => 201, 'message' => 'User saved to DB']);
            }
            return $this->failServerError('Failed to update profile.');

        } catch (\Exception $e) {
            return $this->failServerError('DB Error: ' . $e->getMessage());
        }
    }
    // 🚀 NEW: Get Saved Projects
    public function getSavedProjects() {
        header('Access-Control-Allow-Origin: *');
        $email = $this->request->getVar('email');
        if (!$email) return $this->fail('Missing email');

        $db = \Config\Database::connect();
        $user = $db->table('users')->where('email', $email)->get()->getRowArray();
        
        $saved = [];
        if ($user && $user['saved_projects']) {
            $saved = json_decode($user['saved_projects'], true);
        }
        
        return $this->respond(['saved_projects' => is_array($saved) ? $saved : []]);
        if ($db->table('users')->insert($data)) {
                // 🚀 MASTER LOG: REGISTRATION
                $db->table('system_logs')->insert([
                    'actor_email' => $json->email,
                    'actor_name'  => $json->role === 'agency' ? $json->organization_name : $json->full_name,
                    'actor_role'  => $json->role,
                    'action_type' => 'VIEW SAVED',
                    'description' => "Viewed saved projects for {$json->role} account.",
                    'created_at'  => date('Y-m-d H:i:s')
                ]);
                return $this->respondCreated(['status' => 201, 'message' => 'User saved to DB']);
            }
    }

    // 🚀 NEW: Toggle Save/Follow Project
    public function toggleSaveProject() {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE');
        if ($this->request->getMethod(true) === 'OPTIONS') return $this->response->setStatusCode(200);

        $json = $this->request->getJSON();
        $email = $json->email ?? null;
        $projectId = $json->project_id ?? null;

        if (!$email || !$projectId) return $this->fail('Missing data');

        $db = \Config\Database::connect();
        $user = $db->table('users')->where('email', $email)->get()->getRowArray();
        if (!$user) return $this->fail('User not found');

        $saved = $user['saved_projects'] ? json_decode($user['saved_projects'], true) : [];
        if (!is_array($saved)) $saved = [];

        // Toggle Logic
        if (in_array($projectId, $saved)) {
            $saved = array_values(array_diff($saved, [$projectId])); // Remove
            $status = 'removed';
        } else {
            $saved[] = $projectId; // Add
            $status = 'added';
        }

        $db->table('users')->where('email', $email)->update(['saved_projects' => json_encode($saved)]);
        if ($db->table('users')->insert($data)) {
                // 🚀 MASTER LOG: REGISTRATION
                $db->table('system_logs')->insert([
                    'actor_email' => $json->email,
                    'actor_name'  => $json->role === 'agency' ? $json->organization_name : $json->full_name,
                    'actor_role'  => $json->role,
                    'action_type' => 'SAVE PROJECT',
                    'description' => "Saved project for {$json->role} account.",
                    'created_at'  => date('Y-m-d H:i:s')
                ]);
                return $this->respondCreated(['status' => 201, 'message' => 'User saved to DB']);
            }
        return $this->respond(['status' => 200, 'action' => $status, 'saved_projects' => $saved]);
    }

    // 🚀 NEW: Get Followed Agencies
    public function getFollowedAgencies() {
        header('Access-Control-Allow-Origin: *');
        $email = $this->request->getVar('email');
        if (!$email) return $this->fail('Missing email');

        $db = \Config\Database::connect();
        $user = $db->table('users')->where('email', $email)->get()->getRowArray();
        
        $followed = [];
        if ($user && $user['followed_agencies']) {
            $followed = json_decode($user['followed_agencies'], true);
        }
        if ($db->table('users')->insert($data)) {
                // 🚀 MASTER LOG: REGISTRATION
                $db->table('system_logs')->insert([
                    'actor_email' => $json->email,
                    'actor_name'  => $json->role === 'agency' ? $json->organization_name : $json->full_name,
                    'actor_role'  => $json->role,
                    'action_type' => 'VIEW FOLLOWED AGENCIES',
                    'description' => "Viewed followed agencies for {$json->role} account.",
                    'created_at'  => date('Y-m-d H:i:s')
                ]);
                return $this->respondCreated(['status' => 201, 'message' => 'User saved to DB']);
            }
        return $this->respond(['followed_agencies' => is_array($followed) ? $followed : []]);
    }

    // 🚀 NEW: Toggle Follow Agency
    public function toggleFollowAgency() {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE');
        if ($this->request->getMethod(true) === 'OPTIONS') return $this->response->setStatusCode(200);

        $json = $this->request->getJSON();
        $email = $json->email ?? null;
        $agencyName = $json->agency_name ?? null;

        if (!$email || !$agencyName) return $this->fail('Missing data');

        $db = \Config\Database::connect();
        $user = $db->table('users')->where('email', $email)->get()->getRowArray();
        if (!$user) return $this->fail('User not found');

        $followed = $user['followed_agencies'] ? json_decode($user['followed_agencies'], true) : [];
        if (!is_array($followed)) $followed = [];

        // Toggle Logic
        if (in_array($agencyName, $followed)) {
            $followed = array_values(array_diff($followed, [$agencyName])); // Remove
            $status = 'unfollowed';
        } else {
            $followed[] = $agencyName; // Add
            $status = 'followed';
        }

        $db->table('users')->where('email', $email)->update(['followed_agencies' => json_encode($followed)]);

        // 🚀 MASTER LOG: TOGGLE FOLLOW AGENCY
        $db->table('system_logs')->insert([
            'actor_email' => $json->email,
            'actor_name'  => $json->role === 'agency' ? $json->organization_name : $json->full_name,
            'actor_role'  => $json->role,
            'action_type' => ' FOLLOW AGENCY',
            'description' => "Toggled follow status for agency '{$agencyName}' by {$json->role} account.",
            'created_at'  => date('Y-m-d H:i:s')
        ]);

        return $this->respond(['status' => 200, 'action' => $status, 'followed_agencies' => $followed]);
    }

    // 🚀 NEW: Toggle User Active Status (Deactivate/Reactivate)
    public function toggleStatus() {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE');
        if ($this->request->getMethod(true) === 'OPTIONS') return $this->response->setStatusCode(200);

        $json = $this->request->getJSON();
        $firebaseUid = $json->firebase_uid ?? null;
        $isActive = $json->is_active ?? null;

        if (!$firebaseUid) return $this->fail('Missing user ID');

        try {
            $db = \Config\Database::connect();
            $db->table('users')->where('firebase_uid', $firebaseUid)->update(['is_active' => $isActive]);
            
            return $this->respond(['status' => 200, 'message' => 'User status updated']);
        } catch (\Exception $e) {
            return $this->failServerError('DB Error: ' . $e->getMessage());
        }
    }
}