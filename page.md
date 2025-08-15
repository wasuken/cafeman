```mermaid
graph TD
    A[アプリ開始] --> B{認証状態チェック}
    
    B -->|未認証| C[/login]
    B -->|認証済み| D[/ホーム画面]
    
    C --> E[ログインフォーム]
    E -->|成功| D
    E -->|失敗| C
    E --> F[新規登録リンク]
    F --> G[/register]
    
    G --> H[登録フォーム]
    H -->|成功| C
    H -->|失敗| G
    H --> I[ログインリンク]
    I --> C
    
    D --> J[コーヒー記録入力]
    D --> K[カレンダー表示]
    D --> L[統計表示]
    D --> M[ログアウト]
    D --> N[データ分析リンク]
    
    J -->|記録追加| D
    
    K -->|日付クリック| O[記録詳細モーダル]
    K -->|日付選択モード| P[日付選択]
    O -->|記録削除| D
    O -->|閉じる| D
    P -->|日付選択| D
    
    N --> Q[/charts データ分析画面]
    Q --> R[日別推移タブ]
    Q --> S[時間別分析タブ]
    Q --> T[パターン分析タブ]
    Q --> U[長期トレンドタブ]
    Q --> V[戻るボタン]
    V --> D
    
    M -->|ログアウト| C
    
    %% ミドルウェア
    DD[Middleware] --> EE{セッション確認}
    EE -->|有効| FF[ユーザーID付与]
    EE -->|無効| GG[/login リダイレクト]
    
    style A fill:#e1f5fe
    style C fill:#fff3e0
    style D fill:#e8f5e8
    style G fill:#fff3e0
    style Q fill:#f3e5f5
    style O fill:#fce4ec
    style DD fill:#ffebee
```
