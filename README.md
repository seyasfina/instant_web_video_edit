■サービス概要

youtube等の動画サービスを編集ソフト等を用いずwebブラウザ上で簡易に編集し他者に共有、または保存することで再度見直したいと思った際に、履歴やお気に入りから確認できるサービス。

■ このサービスへの思い・作りたい理由

昨今切り抜き動画や配信等に字幕をつけアップロードするという動画配信スタイルが主流となった現在において、時間がない人や詳細をダイジェストのように確認したいといった需要を満たすことできる切り抜き動画は非常にありがたい存在となっていますが、これは切り抜く人たちが存在するため成り立っているものです。 そのためそのよう方たちがいない場合、通常はソースとなる長尺な動画を自身で一から確認しなければなりません。そこで編集ソフト等を利用せず、ブラウザ上で簡易に編集し保存や共有ができるサービスがあればいいと思い開発に着手しようと考えました。

■ ユーザー層について

動画配信サイトを利用するような人物全体が対象とはなりますが、特に長時間な動画を視聴する人に重宝するサービスとなる予定です。

■サービスの利用イメージ

動画をwebブラウザ上で簡易に編集し、保存することで以後自身が再度その動画を見直そうとした際に自身で編集した動画で内容確認をすることができる。 作成した編集済み動画を共有することで、他のユーザーがその内容を確認できる状態にする。

■ ユーザーの獲得について

切り抜き動画が存在せず、ソースとなる動画を確認するしか手段がないユーザーや当サイトであれば切り抜きがあるかもしれないと期待してくださるユーザー様。 切り抜き動画配信をおこなうユーザーの方や、その方に当サイトでの編集済み動画を提供するユーザー様などに需要があると考えています。

■ サービスの差別化ポイント・推しポイント

動画をインポートして編集・ダウンロードする類のサービスは数多く存在しますが、Webブラウザ上でYouTubeの埋め込み動画（IFrame Player APIを利用）をJavaScriptで直接操作し、指定した開始秒・終了秒をもとにクリップを作成したり、ループのオンオフや複数クリップの連続再生によるあたかも新しい動画として再構成されたかのような再生体験を可能にしつつ、（サーバー側のデータベースに編集内容を保存して再利用・共有できる機能）を備えたサービスは、調べる限りでは見当たりませんでした。 当サービスを利用することで、誰かが作成した編集済み動画を見つけられるかもしれないという期待を抱いていただけます。もし見つからなかった場合でも、自ら簡易編集を行い保存しておくことで、あとから何度でも見返すことが可能です。また、編集済みの動画を共有することで、他のユーザーにとっても有益なコンテンツとして活用していただけます。さらに、YouTube上での切り抜き動画検索にも役立つよう設計しており、より効率的かつ自由な動画視聴体験を実現します。

■ 機能候補

MVPリリースまでに実装しておきたい機能：埋め込みURLによる動画の設置と編集機能、ログイン機能。 本リリースまでに作っておきたい機能：お気に入り機能、履歴機能、公開設定、お気に入りユーザー設定機能、検索機能、タグ機能、紐づけ切り抜き動画登録機能、ソート機能

■ 機能の実装方針予定

IFrame Player APIやYouTube Data APIを使用して動画の埋め込みとjavascript操作による動画コントロールを行う。 CRUD機能を利用しユーザー情報を登録し、編集した動画をアカウントに紐づける。 Ransackによる検索機能の追加や、スクレイピングによる関連切り抜き動画登録機能等を実装予定。。

Figma：https://www.figma.com/design/f6QM52rq6915o5ND6WIvci/Figma-basics?node-id=602-9&t=W6rWTmQk70ZnrtDI-1

ER図：https://drive.google.com/file/d/1j9_DowfEDdVgyJ58wUtRwZMYkVrDOyjn/view?usp=sharing
