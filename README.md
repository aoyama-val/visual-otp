# OpenTripPlannerの経路探索結果を可視化するツール

## 使い方

1. `index.html` の中の `APIキーを入れてね` のところにGoogle MapsのAPIキーを入れます。
2. `localhost:8080` でOpenTripPlannerを起動します。 [参考](https://qiita.com/soeda_jp/items/844104bbb845cbf841db)
3. 下記コマンドでHTTPサーバを立ち上げて、ブラウザで `http://localhost:3000` にアクセスします。

```
ruby -rwebrick -e 'WEBrick::HTTPServer.new(:DocumentRoot => "./", :Port => 3000).start'
```
