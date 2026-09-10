export interface TankenLinkItem {
  title: string;
  url: string;
}

export interface TankenGroup {
  groupName: string;
  items: TankenLinkItem[];
}

export interface TankenCategory {
  id: 'fundamentals' | 'technicals';
  title: string;
  themeColor: string; // orange for fundamentals, green for technicals
  groups: TankenGroup[];
}

export const tankenCategories: TankenCategory[] = [
  {
    id: 'fundamentals',
    title: 'ファンダメンタルズで探す',
    themeColor: '#d97706', // orange-amber
    groups: [
      {
        groupName: '業績上方修正が有望銘柄',
        items: [
          { title: '【第1四半期】時点 中間期上振れ 有望銘柄', url: 'https://kabutan.jp/tansaku/?mode=1_funda_06' },
          { title: '【第1四半期】時点 通期上振れ 有望銘柄', url: 'https://kabutan.jp/tansaku/?mode=1_funda_07' },
          { title: '【中間期】時点 通期上振れ 有望銘柄', url: 'https://kabutan.jp/tansaku/?mode=1_funda_04' },
          { title: '【第3四半期】時点 通期上振れ 有望銘柄', url: 'https://kabutan.jp/tansaku/?mode=1_funda_05' },
        ]
      },
      {
        groupName: '今期【最高益更新】銘柄',
        items: [
          { title: '最高益を見込む【増益率】ベスト100', url: 'https://kabutan.jp/tansaku/?mode=1_f_T-y_Max-eki%26z-eki_Best100' },
          { title: '【連続最高益】銘柄リスト', url: 'https://kabutan.jp/tansaku/?mode=1_f_T-y_Max-eki_5k-rz' },
          { title: '最高益“大復活”銘柄リスト', url: 'https://kabutan.jp/tansaku/?mode=1_f_T-y_Max-eki_5k-br' },
        ]
      },
      {
        groupName: '通期「連続増加中」銘柄',
        items: [
          { title: '「売上高」連続増収ランキング', url: 'https://kabutan.jp/tansaku/consecutive_annual_sales_growth_ranking' },
          { title: '「営業利益」連続増益ランキング', url: 'https://kabutan.jp/tansaku/consecutive_annual_operating_profit_growth_ranking' },
          { title: '「経常利益」連続増益ランキング', url: 'https://kabutan.jp/tansaku/consecutive_annual_ordinary_profit_growth_ranking' },
          { title: '「1株利益」連続増加ランキング', url: 'https://kabutan.jp/tansaku/consecutive_annual_eps_growth_ranking' },
          { title: '「配当」連続増配ランキング', url: 'https://kabutan.jp/tansaku/consecutive_annual_dividend_growth_ranking' },
        ]
      },
      {
        groupName: '四半期「連続増加中」銘柄',
        items: [
          { title: '「売上高」連続増収ランキング', url: 'https://kabutan.jp/tansaku/consecutive_quarter_sales_growth_ranking' },
          { title: '「営業利益」連続増益ランキング', url: 'https://kabutan.jp/tansaku/consecutive_quarter_operating_profit_growth_ranking' },
          { title: '「経常利益」連続増益ランキング', url: 'https://kabutan.jp/tansaku/consecutive_quarter_ordinary_profit_growth_ranking' },
          { title: '「1株利益」連続増加ランキング', url: 'https://kabutan.jp/tansaku/consecutive_quarter_eps_growth_ranking' },
        ]
      },
      {
        groupName: '3ヵ月(四半期)決算で注目銘柄',
        items: [
          { title: '【営業増益率】ベスト100', url: 'https://kabutan.jp/tansaku/?mode=1_funda_01' },
        ]
      },
      {
        groupName: '海外投資家が重視する「ROE」注目銘柄',
        items: [
          { title: '今期【高ROE】ベスト100', url: 'https://kabutan.jp/tansaku/?mode=1_f_T-y_ROE_best100' },
          { title: '【経営効率化が続く】銘柄リスト', url: 'https://kabutan.jp/tansaku/?mode=1_f_T-y_ROE_5k-rz' },
        ]
      }
    ]
  },
  {
    id: 'technicals',
    title: 'テクニカルで探す',
    themeColor: '#16a34a', // green
    groups: [
      {
        groupName: '買いの候補',
        items: [
          { title: '5日と25日移動平均線のゴールデンクロス', url: 'https://kabutan.jp/tansaku/?mode=2_0870' },
          { title: '移動平均線上昇トレンド銘柄', url: 'https://kabutan.jp/tansaku/?mode=2_0262' },
          { title: '25日線マイナスカイリ －10％以上', url: 'https://kabutan.jp/tansaku/?mode=2_0278' },
        ]
      },
      {
        groupName: '売りの候補',
        items: [
          { title: '5日と25日移動平均線のデッドクロス', url: 'https://kabutan.jp/tansaku/?mode=2_0871' },
          { title: '移動平均線下降トレンド銘柄', url: 'https://kabutan.jp/tansaku/?mode=2_0266' },
          { title: '25日線プラスカイリ ＋10％以上', url: 'https://kabutan.jp/tansaku/?mode=2_0272' },
        ]
      },
      {
        groupName: 'デイトレ向き',
        items: [
          { title: '出来高急増銘柄', url: 'https://kabutan.jp/tansaku/?mode=2_0311' },
        ]
      },
      {
        groupName: 'トレンド追随型の指標【主に順張り】',
        items: [
          { title: '一目均衡表「3役好転」', url: 'https://kabutan.jp/tansaku/?mode=2_0427' },
          { title: '一目均衡表「3役逆転」', url: 'https://kabutan.jp/tansaku/?mode=2_0428' },
          { title: 'パラボリック陽転', url: 'https://kabutan.jp/tansaku/?mode=2_0476' },
          { title: 'パラボリック陰転', url: 'https://kabutan.jp/tansaku/?mode=2_0478' },
          { title: '新値3本足陽転', url: 'https://kabutan.jp/tansaku/?mode=2_0490' },
          { title: '新値3本足陰転', url: 'https://kabutan.jp/tansaku/?mode=2_0493' },
        ]
      },
      {
        groupName: 'オシレーター系の指標【主に逆張り】',
        items: [
          { title: 'RSI（14日線）20%以下', url: 'https://kabutan.jp/tansaku/?mode=2_0460' },
          { title: 'RSI（14日線）80%以上', url: 'https://kabutan.jp/tansaku/?mode=2_0462' },
          { title: 'MACD/買いシグナル', url: 'https://kabutan.jp/tansaku/?mode=2_0440' },
          { title: 'MACD/売りシグナル', url: 'https://kabutan.jp/tansaku/?mode=2_0445' },
        ]
      }
    ]
  }
];
