# Grand Forms

通用数据采集。

- 用 JSON 配置表单：
- 生成 Web 表单，类似在线调查问卷；
- 适配手机；
- 生成原生 app；\*

## 如何部署

### back-end

web 后端是一个 Node Express HTTP(S) 服务，用 pm2 之类的进程管理器运行即可，如

`pm2 start bin/www`

### front-end

web 前端是一个 CRA (Create React App) 程序，全部是静态文件，所以可以在 Nginx
中配置一个以 build 目录为 root 的虚拟机，如

```
  # cat grand-forms.conf
  server {
      listen       443;
      server_name  forms.grandlynn.com;
      root /opt/workspace/grand-forms/client/build;

      location / {
          try_files $uri /index.html;
          add_header   Cache-Control public;
          expires      1d;
      }

      location /api/ {
          proxy_pass http://localhost:3003/api/;
          include proxy.conf;
          index  index.html index.htm index.jsp index.do;
      }
  }
```

以上 Nginx 配置中的几个要点：

1. 需要把 API 请求（路径模式为 /api/） proxy\_pass 到后端；
2. 如果没有从 CRA src/index.js 中移除 registerServiceWorker()，则需要开启 SSL；
