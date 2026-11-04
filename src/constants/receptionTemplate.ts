import type { Activity } from './activities';

export const RECEPTION_MINUTES = 150;

function program(
  id: string,
  name: string,
  nameJa: string,
  duration: number,
  staffNotes: Activity['staffNotes'],
  options: Partial<Activity> = {},
): Activity {
  return { id: `reception-${id}`, name, nameJa, duration, isOptional: false, staffNotes, ...options };
}

export function createReceptionTemplate(): Activity[] {
  return [
    program('setup', 'Venue and equipment check', '会場準備・機材確認', 20, {
      planner: '会場と進行・配膳・退館時刻確認／各担当に合図共有',
      sound: 'マイク・BGM・予備音源確認',
      lighting: '入場・上映・撮影の照明確認',
    }, { isPrep: true, projector: '本番機で映像・音声確認／予備ファイル用意' }),
    program('check-in', 'Guest check-in', 'ゲスト受付・着席', 30, {
      escort: '受付→席へ案内／通路確保',
      photo: '受付・ゲスト撮影',
      caterer: 'アレルギー対応席・提供順確認',
      planner: '受付・会場準備確認→開会合図',
    }, { isPrep: true }),
    program('opening', 'Opening remarks', '開会のあいさつ', 5, {
      mc: '新郎新婦の読み確認／開会・入場案内',
      sound: '司会マイクON／BGM音量↓',
      planner: '入場口・各担当の準備確認',
    }),
    program('entrance', 'Couple entrance', '新郎新婦入場', 5, {
      escort: '扉前待機→合図で開扉→メイン席へ',
      photo: '入場口・正面から撮影／通路確保',
      lighting: '入場口→メイン席にスポット',
      sound: '開扉合図で入場曲→着席後フェード',
    }),
    program('welcome', 'Welcome speech', 'ウェルカムスピーチ', 5, {
      mc: '新郎新婦紹介→あいさつ',
      sound: '新郎新婦へマイク／BGM音量↓',
    }),
    program('toast', 'Toast', '乾杯', 5, {
      mc: '乾杯担当紹介／グラス案内',
      caterer: '全卓グラス確認→乾杯後に配膳',
      photo: '乾杯担当・会場全景を撮影',
    }),
    program('meal', 'Meal and conversation', '食事・歓談', 25, {
      caterer: '配膳／次の演出前に通路・配膳状況確認',
      photo: 'ゲストの自然な表情・新郎新婦との交流を撮影',
      sound: '歓談BGMは控えめに',
    }),
    program('cake', 'Cake cutting and first bite', 'ケーキ入刀・ファーストバイト', 10, {
      planner: 'ナイフ・スプーン・台確認→開始合図',
      caterer: 'ケーキ準備／演出中は周辺の配膳を控える',
      mc: '撮影位置案内→入刀・ファーストバイト進行',
      photo: '新郎新婦の表情・手元を撮影',
      lighting: 'ケーキ台・新郎新婦を照らす',
    }),
    program('exit', 'Exit for outfit change', '中座', 5, {
      mc: '付き添い紹介／お色直し中の流れを案内',
      escort: '付き添い案内→新郎新婦を控室へ',
      photo: '付き添いとの退場を撮影',
    }),
    program('change', 'Outfit change', 'お色直し', 30, {
      escort: '着替え進捗確認→再入場口へ案内',
      planner: '着付け・ヘア担当と残り時間確認／遅れは司会へ',
      mc: '上映後に歓談案内→再入場合図待ち',
      caterer: '歓談中に配膳／上映中は作業音を抑える',
    }, {
      durationOptions: [
        { minutes: 20, label: 'ドレスのみ（20分）' },
        { minutes: 30, label: 'ドレス＋ヘア調整（30分）' },
        { minutes: 40, label: 'ドレス＋ヘア変更（40分）' },
      ],
      subActivities: [
        program('film', 'Profile film during outfit change', 'プロフィール映像上映', 7, {
          sound: '映像音声↑→終了後は歓談BGM',
          lighting: '上映中は客席を暗く→終了後に復帰',
        }, { startOffset: 0, projector: '司会合図で再生／再生不可は進行へ連絡' }),
      ],
      coordinationNotesJa: '上映→食事・歓談（上映はお色直し時間内）',
    }),
    program('reentry', 'Couple re-entry', '再入場', 5, {
      planner: '新郎新婦・司会・撮影・音響・照明確認→合図',
      escort: '再入場口で衣装・動線確認',
      photo: '新衣装・ゲストの反応を撮影',
      lighting: '開扉で新郎新婦を照らす',
      sound: '合図で再入場曲',
    }),
    program('tables', 'Table visits and photos', 'テーブルラウンド・撮影', 15, {
      escort: '順に各卓へ案内',
      photo: '各卓で集合写真',
      caterer: '対象卓は撮影後に配膳',
    }),
    program('game', 'Guest activity', 'ゲスト参加ゲーム', 10, {
      mc: 'ルールを短く説明→時間内に結果発表',
      planner: '景品用意／遅れたら回数を減らす',
      sound: '必要に応じマイク・効果音',
    }, { isOptional: true }),
    program('buffer', 'Conversation and buffer', '歓談・予備時間', 5, {
      planner: '遅れ調整／謝辞・集合写真の準備確認',
    }),
    program('thanks', 'Couple thank-you speech', '新郎新婦の謝辞', 5, {
      mc: '新郎新婦の謝辞を案内',
      sound: 'マイク用意／話し始めでBGM音量↓',
      photo: '新郎新婦・ゲストの表情を撮影',
    }),
    program('group', 'Group photo', '全員集合写真', 10, {
      mc: '集合場所案内',
      escort: 'ゲストを撮影場所へ',
      photo: '整列／全員が写るか確認',
      lighting: '集合場所全体を照らす',
    }),
    program('farewell', 'Closing, exit and farewell', '閉会・退場・お見送り', 10, {
      mc: '閉会あいさつ／お見送り場所案内',
      escort: '新郎新婦を出口へ／ゲスト列整理',
      planner: 'お見送り終了・退館時刻確認',
      caterer: '忘れ物確認／会場と片付け開始を調整',
    }),
  ];
}
