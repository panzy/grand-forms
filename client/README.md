# Front-end of Grand Forms

这是个 CRV (Create React App) 程序，详见 README.CRV.md 。

## 关于安装的注意事项

package.json 中有个特殊的依赖项：react-jsonschema-form。它不是直接来自 npm，而是 fork 自
mozilla-services/react-jsonschema-form。这个依赖项的安装流程是：

```
# 1. clone forked mozilla-services/react-jsonschema-form
cd ~/workspace
git clone ssh://git@58.211.187.150:8122/GrandForms/react-jsonschema-form

# 2. build react-jsonschema-form lib
cd ~/workspace/react-jsonschema-form
npm install
npm run build:lib

# 3. add dependency here
cd ~/workspace/grand-forms/client
npm install -D ~/workspace/react-jsonschema-form
```
