# Grand Forms

通用数据采集。

- 用 JSON 配置表单：
- 生成 Web 表单，类似在线调查问卷；
- 适配手机；

## 开发环境中如何运行

步骤：

1. 运行 backend: `PORT=3001 node-dev bin/www`
2. 运行 frontend: `cd client && npm start`，启动脚本将自动在浏览器中打开网站首页

如何后端不是 http://localhost:3001，则需要修改 `client/package.json` 中的 `proxy`。

## 如何部署

### 是否需要修改网站首页路径？

缺省的部署路径是 /grand-forms，即网站首页地址为（域名不重要）

http://grandlynn.com/grand-forms

若要更改该路径，需要修改三个地方：

1. client/package.json `homepage`
2. client/src/App.js `const BASENAME`
3. test/deploymentTest.js `const HOMEPAGE`

可以改为部署到网站根目录。

修改后需要重新构建前端。

### 构建前端

`cd client && npm run build`

### 运行后端 Express 服务

web 后端是一个 Node Express HTTP(S) 服务，用 `pm2` 之类的进程管理器运行即可，如

`pm2 start bin/www`

### 配置前端 HTTP 服务

web 前端是一个 CRA (Create React App) 程序，全部是静态文件，可以采用任何 HTTP 服务。

如果网站部署路径是 /，则不需要额外的 HTTP 服务，后端 Express 服务已经提供了对前端文件的访问。也即以
Express 服务作为网站入口。

否则，需要让其它 HTTP 服务器提供前端文件，比如以下请求：

- http://grandlynn.com/grand-forms/index.html
- http://grandlynn.com/grand-forms/static/js/main.aeaee4a1.js

另外，既然该 HTTP 服务器已经作为网站入口，它需要把前端的 AJAX 请求转发给后端，比如以下请求：

http://grandlynn.com/grand-forms/api/forms
=>
http://localhost:3001/api/forms

再次，由于我们采用了前端路由（client-side routing），该 HTTP 服务器还应将前端路由表中的 URLs 重写到 index.html，
比如

http://grandlynn.com/grand-forms/forms/000000/view
=>
http://grandlynn.com/grand-forms/index.html

Nginx 配置示例：

```
#
# Grand Forms frontend
#
# 部署到相对路径 /grand-forms，因此 Grand Forms 的首页地址为
# http://mywebsite.com/grand-forms/

# Grand Forms backend
location /grand-forms/api/ {
    proxy_pass http://localhost:3003/api/;
    include proxy.conf;
}

# 静态文件，就是 client/build 目录中的内容。
# 如果 client/build 已经复制到当前 nginx server root 下面的 grand-forms
# 目录，则此 location 指令可以省略。
location /grand-forms {
    root /var/www/html/;
    index index.html;
    # 由于 Grand Froms 采用了 Client-Side Routing，
    # 对于所有 uri，除非对应的文件存在，否则总是应答 index.html 。
    try_files $uri /grand-forms/index.html;
}

```

### 测试

运行以下命令来测试网站是否已经正确部署：

`mocha test/deploymentTest.js`

