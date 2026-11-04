export const PREPARATION_OWNERS = ['未定', 'Client', 'Amore', '会場・業者'] as const;
export type PreparationOwner = typeof PREPARATION_OWNERS[number];
export type Preparation = { item: string; owner: PreparationOwner; readyTime: string };
export type VendorArrival = { role: string; name: string; arrival: string; ready: string };

export const OWNER_COLORS: Record<PreparationOwner, string> = {
  未定: 'FF57534E',
  Client: 'FF926000',
  Amore: 'FF1D4ED8',
  '会場・業者': 'FF166534',
};

export const VENDOR_SECTION = '業者到着・準備完了';
export const VENDOR_ROLES = ['会場・責任者', '司会・司式者', '写真・映像', 'ヘアメイク', '装飾・装花', '料理・ケーキ', '音響映像・音楽', '送迎・その他'];

const rules: [RegExp, [string, PreparationOwner][]][] = [
  [/会場準備|搬入|設営|venue preparation|equipment check/i, [
    ['搬入経路・駐車場・会場制限の確認', 'Amore'],
    ['装飾・装花・フォトボード・案内表示を設置', '未定'],
    ['進行表・合図・音響映像・予備ファイル確認', 'Amore'],
  ]],
  [/受付|check.in|guest reception/i, [
    ['受付担当・通訳、ゲスト名簿・席次表・案内表示を準備', '未定'],
    ['引出物の数量・渡し方を確認', '未定'],
  ]],
  [/着席|食事|歓談|meal|catering/i, [
    ['席札・メニュー配置／最終人数・食事配慮を会場へ共有', '未定'],
  ]],
  [/リハーサル|rehearsal/i, [['司会・司式者と台本、役割、動線、合図を確認', 'Amore']]],
  [/ヘアメイク|お支度|hair.*makeup|bride prep/i, [['衣装・ベール・靴・小物と介添えの準備を確認', '未定']]],
  [/挙式|人前式|civil ceremony|wedding ceremony/i, [['式次第・司式者・参加者・必要書類を確認', '未定']]],
  [/証明書.*(?:サイン|署名)|署名|(?:sign|signing).*certificate/i, [
    ['結婚証明書・署名用ペンを準備', '未定'],
    ['証人と署名の順番を確認', 'Amore'],
  ]],
  [/指輪交換|ring exchange/i, [['結婚指輪の準備・保管／受け渡し担当確認', 'Client']]],
  [/誓い|スピーチ|謝辞|vow|speech/i, [['原稿・マイク・話す順番を確認', '未定']]],
  [/乾杯|toast/i, [['乾杯の担当者と全卓の飲み物を確認', '会場・業者']]],
  [/ケーキ入刀|ファーストバイト|cake cutting|first bite/i, [['ケーキ・台・ナイフ・スプーンを準備', '会場・業者']]],
  [/お色直し|中座|outfit change|dress change/i, [['2着目の衣装・小物・荷物・控室への動線を確認', '未定']]],
  [/入場|entrance|re.entry/i, [['入場の動線・BGM・照明・開始の合図を確認', 'Amore']]],
  [/映像上映|ムービー|profile film|profile video/i, [['映像・音声の試写／予備データ用意', 'Amore']]],
  [/ゲーム|余興|guest activity|quiz/i, [['ゲーム内容・備品・景品・進行担当を確認', '未定']]],
  [/集合写真|撮影|group photo|table.*photo/i, [['必須カット・撮影場所・集合案内を確認', 'Amore']]],
  [/送賓|お見送り|farewell|sending off/i, [['送迎・出発時刻／贈り物・現金・私物の引き渡し先確認', '未定']]],
  [/撤収|撤去|cleanup/i, [['レンタル品の返却・撤収・会場引き渡しを確認', '未定']]],
];

export function programPreparations(activity: {
  name: string; nameJa?: string; nameEn?: string; preparations?: Preparation[];
}): Preparation[] {
  if (activity.preparations !== undefined) return activity.preparations;
  const names = [activity.name, activity.nameJa, activity.nameEn].filter(Boolean).join(' ');
  return rules.flatMap(([pattern, items]) => pattern.test(names)
    ? items.map(([item, owner]) => ({ item, owner, readyTime: '' })) : []);
}
