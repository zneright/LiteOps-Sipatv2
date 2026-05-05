$routes->group('api', ['namespace' => 'App\Controllers'], function($routes) {
    // Your existing routes...
    $routes->options('users', 'UserController::create'); 
    $routes->post('users', 'UserController::create'); 
    $routes->get('users', 'UserController::index'); 

    // NEW: Get a single user by email
    $routes->options('users/(:segment)', 'UserController::show/$1'); 
    $routes->get('users/(:segment)', 'UserController::show/$1'); 
});