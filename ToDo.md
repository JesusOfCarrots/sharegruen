Del old files:

```bash
crontab -e
```

```bash
0 * * * * find /var/www/myflaskapp/uploads -type f -mmin +1440 -delete
```


With Logging
```bash
0 * * * * find /var/www/myflaskapp/uploads -type f -mmin +1440 -print -delete >> /var/log/upload_cleanup.log 2>&1
```


Check for permission
```bash
sudo chown -R www-data:www-data /var/www/myflaskapp/uploads
sudo chmod -R 755 /var/www/myflaskapp/uploads
```

Test it
```bash
find /var/www/myflaskapp/uploads -type f -mmin +1 -delete
```