---
title: Third Party Packages
---

Traditionally, PHP applications use Composer to autoload installed dependencies and autoload the application (`app/`) itself. Because Voltis is based on the Swoole networking library, Voltis uses a persistent execution model, the HTTP server is not stateless and the server is persistent across requests.

What does all this mean for Composer? – Well, it means we could reply on the normal way Composer autoloads dependencies but that would be a wasted opportunity. Because of the persistent execution model of Swoole, Voltis can preload your whole application and Composer installed dependencies, making them available right from the start during the server startup phase.

Instead of letting Composer’s autoloader define classes and files only when they are requested, meaning it would need to use its class map or at worst check the file system and load classes, Voltis will use the class map generated by Composer and preload all dependencies into memory using `require_once`. This means the performance of your request cycles are increased because there won’t be a need to perform a class map lookup (which can hider performance if your class map is huge) or run a file system check to find a class to load.

Voltis already handles the loading of your application, configuration files and service preparation and initialization, so it seems pointless not to handle the loading of your third party packages from Composer when considering the persistence nature of Swoole. Composer will still handle dependency management, installing and updating etc. But the only difference is Voltis will use Composer’s autoload class map to preload dependencies using `require_once` during server boot-up. Making all your dependencies available in memory, ready to be used whenever and no class map or file system lookups during a request cycle. You are also free to create services based on your Composer dependencies and make them global etc.

Lastly, when developing your application with Voltis and keeping this Composer preloading in mind, you may have thought won’t this add additional startup time to the server? – Well you are correct, it means whenever you are developing your application and making changes to your code and waiting for the server to restart to test your changes, you have to wait longer for the sever to be ready. That’s where the configuration option ` autoGenerateComposerClassmap` inside `main.php` comes in. This configuration option allows you to choose when Voltis automatically regenerates the Composer class map at server startup, you only need to regenerate the class map whenever you make changes to your Composer dependencies. For production it is probably best to set this option to `true` so you can garrantee you have the latest changes in your class map but during development, you could perform class map generation manually using:

```bash
composer update -o

composer dumpautoload -o
```