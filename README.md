# maium

## Grafana (monitoring)

### Lancer Grafana

```bash
docker run -d \
  --name grafana \
  -p 3000:3000 \
  -v grafana-storage:/var/lib/grafana \
  grafana/grafana
```

### Nginx reverse proxy

Créer `/etc/nginx/sites-enabled/grafana.maium.app` :

```nginx
server {
    server_name grafana.maium.app;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    listen 80;
}
```

```bash
nginx -t && systemctl reload nginx
certbot --nginx -d grafana.maium.app
```

Accessible sur `https://grafana.maium.app` — login `admin` / `admin`.

### Connecter Supabase

Créer un user read-only dans le SQL Editor Supabase :

```sql
create role grafana_reader with login password 'MotDePasse';
grant usage on schema public to grafana_reader;
grant select on all tables in schema public to grafana_reader;
alter default privileges in schema public grant select on tables to grafana_reader;
```

Dans Grafana → **Connections** → **Add new data source** → **PostgreSQL** :

| Champ | Valeur |
|-------|--------|
| Host | `db.[project-id].supabase.co:5432` |
| Database | `postgres` |
| User | `grafana_reader` |
| TLS/SSL Mode | `require` |
