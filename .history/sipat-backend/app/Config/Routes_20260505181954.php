<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
$routes->get('/', 'Home::index');

// 1. We group it under 'api' to match your React fetch URL (http://localhost:8080/api/users)
// 2. We point the namespace to App\Controllers since you don't have an Api folder
$routes->group('api', ['namespace' => 'App\Controllers'], function($routes) {
    
    // Catch the browser's CORS preflight security check
    $routes->options('users', 'UserController::create'); 
    
    // Catch the actual React POST request
    $routes->post('users', 'UserController::create'); 
});