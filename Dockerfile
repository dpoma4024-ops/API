# Imagen base con Apache + PHP
FROM php:8.2-apache

# Habilitar extensiones necesarias (si usas MySQL cambia a mysqli/pdo_mysql)
RUN docker-php-ext-install pdo pdo_mysql

# Copiar tu proyecto al servidor web
COPY . /var/www/html/

# Dar permisos
RUN chown -R www-data:www-data /var/www/html

# Habilitar mod_rewrite (importante si usas rutas limpias)
RUN a2enmod rewrite

# Exponer el puerto 80
EXPOSE 80
