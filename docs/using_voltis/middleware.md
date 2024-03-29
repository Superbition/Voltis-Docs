---
title: Middleware
---

In Voltis there is a Middleware mechanism that allows you to filter incoming HTTP requests and act upon those requests during two stages in your application; the two stages being before and after.

A good example is you might create a Middleware to check that a user has permission to view a certain page and if not, you redirect them to the login screen or display an error message.

Middleware can be used for more than just authentication though, you might create a Middleware to store logs of user actions or add additional HTTP headers to your responses.

Voltis provides you with some default Middleware out of the box, such as CSRF protection or a Middleware to redirect users if trying to access a page only intended for guest users. All this Middleware can be found within the ` app\Http\Middleware` directory.

## Creating Middleware

To create a new Middleware, you can use the Voltis command `middleware`:

```text
php voltis middleware:create LogRequestMiddleware
```

You can use `middleware:create` to define a new Middleware and this command will create a new class for you and place it in the appropriate directory for you, created from the default Middleware definition.

All Middleware is located in `app\Http\Middleware`.

When trying to mentally understand how Middleware works, think of it as “layers” your application has to pass through in order for the request to continue deeper into your application. With each layer that the HTTP request goes through, the more that request is closure to the core action and with each layer, the request can be altered and rejected early on.

:::info
When Middleware is executed during a request it is all resolved through the dependency injection container from the HTTP Kernel, meaning you can type-hint any extra dependencies you may need within your middleware’s class constructor to access other services.
:::

## Before and After Middleware

There are two types of Middleware that you can create, the first being a “before” and "after" Middleware and it depends on how you structure the Middleware class in order to define a “before” or "after" Middleware. 

### Before

Taking a look at the example below, Voltis will execute the `process()` function before an application request takes place, allowing you to perform actions before a request is processed further.

When calling `$nextMiddleware()` this will pass the `$request` object onto the next Middleware in the stack, if there is none left and no early response has been returned, the core action will be executed.

```php
namespace App\Http\Middleware;

use Closure;

class BeforeMiddleware
{
    public function process($request, Closure $nextMiddleware)
    {
        // Perform any actions before a request has its core action executed...

        return $nextMiddleware($request);
    }
}
```

### After

To define a Middleware which executes after a request has been processed, you get the response from the core action first, checkout the example below to see how this is done:

```php
namespace App\Http\Middleware;

use Closure;

class AfterMiddleware
{
    public function process($request, Closure $nextMiddleware)
    {
        $response = $nextMiddleware($request);

        // Perform any actions after the core action has formed a response...

        return $response;
    }
}
```

When you want to perform operations after the application has handled the request, you have to get that response by calling `$nextMiddleware()` which will return either a response from another Middleware if it has returned early or it will be the response from the core action. By performing any operations after the call to `$nextMiddleware` we are operating after the request has been handled by your application.

## Registering Middleware

Before you can attach Middleware to a specified route you must assign a Middleware alias inside the HTTP Kernel class which will be located at `app\Http\Kernel.php`, for example the route aliases could look like:

```php
protected array $routeMiddlewareAliases = [

    'RedirectIfAuthenticated' => \App\Http\Middleware\RedirectIfAuthenticatedMiddleware::class,
    'Auth' => \App\Http\Middleware\AuthenticateMiddleware::class,
    'IsVerified' => \App\Http\Middleware\UserVerificationMiddleware::class,
    'ConfirmPassword' => \App\Http\Middleware\ConfirmPasswordMiddleware::class,

];
```

:::info
All Middleware that you create within your application are preloaded and defined during the server boot process, making them available straight away, and speeding up requests. Middleware which is defined inside your HTTP Kernel is also pre-processed during server boot time and automatically optimised and cached, meaning sorting and conversions don’t happen during the request cycle.
:::

### Attaching Middleware to a Route

Once you have defined your Middleware you will want to attach them to a Route request. This can be easily done by defining a route using `middleware()`:

```php
Route::get("/", "Index@home")
        ->middleware("LogRequestMiddleware");
```

This attaches the Middleware called `LogRequestMiddleware` to the `/` Route and will be executed every time this Route is called. It is best to always add “Middleware” to the end of your class names so that you know it is a Middleware class.

### Attaching multiple Middleware

Sometimes a route may be required to have more than one Middleware attached to it, this can be easily done by sending an array to the `middleware()` function:

```php
Route::get("/", "Index@home")
        ->middleware(["LogRequestMiddleware", "UserAuthMiddleware"]);
```

Same goes for any other HTTP Request Method:

```php
Route::post("/", "Index@home")
        ->middleware(["LogRequestMiddleware", "UserAuthMiddleware"]);
```

You can pass in as many as you like but take note that each Middleware will be executed by the framework in the order they sit from the array that is passed in. If you want a Middleware to be executed in a different order, just rearrange the order of the array.

### Global Middleware

Global Middleware is registered inside the HTTP Kernel which is located within your application at: `app\Http\Kernel.php`. Inside the Kernel you may specify any global Middleware you wish to run before or after a request.

If you need to run certain middleware for every HTTP request that enters your application, you can define global middleware inside your HTTP Kernel, for example:

```php
protected array $globalMiddlewareStack = [

    \App\Http\Middleware\ValidateCsrfTokenMiddleware::class,

];
```

:::caution
Global Middleware will be executed first before any manually configured Middleware
:::

:::info
You can use middleware class aliases or group names within the global middleware stack and they will be converted/optimized during server boot.
:::

### Middleware Groups

If you have loads of middleware classes, it may be easier for you to group certain middleware together as part of a group, which you can then assign to specific routes, making it easier to bulk assign middleware, by default Voltis already defines two main groups, these groups are the `web` group for web requests only and is assigned to every web route automatically, and an `api` group which is also assigned to API routes automatically.

```php
protected array $middlewareGroups = [

    'web' => [

        \App\Http\Middleware\ValidateCsrfTokenMiddleware::class,

    ],

    'api' => [

        // ...

    ],

];
```

As stated before, you can then use these groups to attach on a route or within a route group:

```php
Route::get('/', function() 
{
    // ...
})->middleware('web');

Route::group(['prefix' => '/api', 'middleware' => 'api'], function()
{
    // ...
});
```

:::note
Remember that by default the web middleware group is assigned to every web route and the API middleware group is assigned to every API route.
:::

## Returning a Response from Middleware

### Returning a response before

If you need to return a response early within a middleware, both through before or after middleware types, you can do by performing a normal return just like you would do inside a Controller.

For example:

```php
namespace App\Http\Middleware;

use Closure;

class BeforeMiddleware
{
    public function process($request, Closure $nextMiddleware)
    {
        if(...)
        {
            // Return an early response because our condition was met
            return redirect('/');
        }

        return $nextMiddleware($request);
    }
}
```

This will return a response early, execution for any other Middleware will not happen, nor will the Controller be executed.

### Returning a response after

```php
namespace App\Http\Middleware;

use Closure;

class AfterMiddleware
{
    public function process($request, Closure $nextMiddleware)
    {
        $response = $nextMiddleware($request);

        if(...)
        {
            // Return a response after the request was handled because our condition was met
            return redirect('/');
        }

        return $response;
    }
}
```

In the example above, the Middleware allows the application to handle the response first but if the condition is met, then a different response is returned.

### Queuing Headers

If you want to just add something to the Response like a header, you can do this (best to use a global Middleware if it happens for every request):

```php
namespace App\Http\Middleware;

use Closure;

class QueueHeadersMiddleware
{
    public function process($request, Closure $nextMiddleware)
    {
        $response = $nextMiddleware($request);

        $response->queueHeader('key', 'value');

        return $response;
    }
}
```

Here this middleware will queue a header to be added to the Response and the final Response won't be affected, just altered.

For more documentation on sending back a Response, checkout the [Response Documentation](/using_voltis/response)

:::caution
If you return a response in an after middleware, this return will take priority over the Controller Response, because it means the middleware gives you the ability to change the response just before the final response is sent to the client.
:::

### Setting the HTTP status code

You may want to use a middleware to specifically set the HTTP status code and return your own response if certain conditions are met. This has to be done after your application has handled the response first:

```php
namespace App\Http\Middleware;

use Closure;

class AfterMiddleware
{
    public function process($request, Closure $nextMiddleware)
    {
        $response = $nextMiddleware($request);

        if(...)
        {
            // Set a custom HTTP status code for the response
            $response->setStatusCode(500);
        }

        return $response;
    }
}
```

### Returning a View

It is possible to return a view from your middleware, for example:

```php
namespace App\Http\Middleware;

use Closure;

class BeforeMiddleware
{
    public function process($request, Closure $nextMiddleware)
    {
        if(...)
        {
            // Halts further execution early and returns a rendered view
            return response(view('InvalidRequest:error'));
        }

        return $nextMiddleware($request);
    }
}
```

This is a very simple example and there is much more to the view system, visit its full documentation [here.](/using_voltis/views)

## Middleware Parameters

Your Middleware can also accept optional parameters, making it easy to adjust what the Middleware can respond to.

For example, you might have a Middleware which checks if the user was active on a certain device but want to keep all the functionality in the same place, take a look at this example:

```php
namespace App\Http\Middleware;

use Closure;

class BeforeMiddleware
{
    public function process($request, Closure $nextMiddleware, $device)
    {
        if($device === 'ios')
        {
            // ...
        }

        if($device === 'android')
        {
            // ...
        }

        if($device === 'pc')
        {
            // ...
        }

        return $nextMiddleware($request);
    }
}
```

You can use the parameter to alter the way a Middleware response to your request. Middleware parameters are always pass into the `handle` method last.

To define the above Middleware example using parameters you can assign this to a route like so:

```php
Route::get('active/check', function () {
    // ...
})->middleware('CheckLastActiveMiddleware:ios');
```

Parameters are set after the `:`, multiple parameters can be passed by using a comma to separate them apart:

```php
Route::get('active/check', function () {
    // ...
})->middleware('CheckLastActiveMiddleware:ios,android,pc');
```
