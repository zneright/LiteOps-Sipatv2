<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
$routes->get('/', 'Home::index');

$routes->group('api', ['namespace' => 'App\Controllers'], function($routes) {
    // Catch the browser's CORS preflight security check
    $routes->options('users', 'UserController::create'); 
    
    // Catch the actual React POST request (Sign Up)
    $routes->post('users', 'UserController::create'); 

    // NEW: Catch GET requests (To view all users)
    $routes->get('users', 'UserController::index'); 

    $routes->options('users/(:segment)', 'UserController::show/$1'); 
    $routes->get('users/(:segment)', 'UserController::show/$1');
});