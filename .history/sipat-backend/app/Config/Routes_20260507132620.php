<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
$routes->get('/', 'Home::index');
$routes->group('api', ['namespace' => 'App\Controllers'], function($routes) {
    $routes->options('users', 'UserController::create'); 
    $routes->post('users', 'UserController::create'); 
    $routes->get('users', 'UserController::index'); 

    $routes->options('projects', 'ProjectController::create');
    $routes->post('projects', 'ProjectController::create');
    $routes->get('projects', 'ProjectController::index'); 
    
    $routes->options('projects/(:num)', 'ProjectController::update/$1'); 
    $routes->put('projects/(:num)', 'ProjectController::update/$1');
    $routes->options('projects/(:num)', 'ProjectController::show/$1');
    $routes->get('projects/(:num)', 'ProjectController::show/$1'); 
    
    $routes->options('projects/(:num)/react', 'ProjectController::react/$1');
    $routes->put('projects/(:num)/react', 'ProjectController::react/$1');

    $routes->options('comments', 'CommentController::create');
    $routes->post('comments', 'CommentController::create'); 
    $routes->get('comments/(:num)', 'CommentController::index/$1'); 
    
    $routes->options('comments/(:num)/react', 'CommentController::react/$1');
    $routes->put('comments/(:num)/react', 'CommentController::react/$1'); 
    
    $routes->options('users/(:segment)', 'UserController::update/$1'); 
    $routes->put('users/(:segment)', 'UserController::update/$1');

    $routes->options('users/saved', 'UserController::getSavedProjects');
    $routes->get('users/saved', 'UserController::getSavedProjects');
    
    $routes->options('users/toggle-save', 'UserController::toggleSaveProject');
    $routes->post('users/toggle-save', 'UserController::toggleSaveProject');

    $routes->options('users/followed-agencies', 'UserController::getFollowedAgencies');
    $routes->get('users/followed-agencies', 'UserController::getFollowedAgencies');
    
    $routes->options('users/toggle-follow-agency', 'UserController::toggleFollowAgency');
    $routes->post('users/toggle-follow-agency', 'UserController::toggleFollowAgency');

    $routes->options('projects/search', 'ProjectController::search');
    $routes->get('projects/search', 'ProjectController::search');

    $routes->options('users/toggle-status', 'UserController::toggleStatus');
    $routes->post('users/toggle-status', 'UserController::toggleStatus');

    $routes->options('logs', 'LogController::index');
    $routes->get('logs', 'LogController::index');
    $routes->options('logs/create', 'LogController::create');
    $routes->post('logs/create', 'LogController::create');
});
    

