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
      planner: '会場と進行、配膳、退館時刻を確認。各担当に合図を共有。',
      sound: 'マイク、BGM、予備音源を確認。',
      lighting: '入場・上映・撮影時の照明を確認。',
    }, { isPrep: true, projector: '映像と音声を本番機で再生確認。予備ファイルを用意。' }),
    program('check-in', 'Guest check-in', 'ゲスト受付・着席', 30, {
      escort: '受付から席まで案内。通路を空ける。',
      photo: '受付とゲストの様子を撮影。',
      caterer: 'アレルギー対応席と提供順を確認。',
      planner: '受付と会場の準備状況を確認して開会の合図。',
    }, { isPrep: true }),
    program('opening', 'Opening remarks', '開会のあいさつ', 5, {
      mc: 'お二人の名前の読み方を確認。開会と入場をご案内。',
      sound: '司会マイクを入れ、BGMを下げる。',
      planner: '入場口と各担当の準備を確認。',
    }),
    program('entrance', 'Couple entrance', '新郎新婦入場', 5, {
      escort: '扉前で待機。合図で扉を開け、メイン席へ案内。',
      photo: '入場口と正面から撮影。通路をふさがない。',
      lighting: '入場口からメイン席までスポットを合わせる。',
      sound: '扉が開く合図で入場曲を再生。着席後にフェード。',
    }),
    program('welcome', 'Welcome speech', 'ウェルカムスピーチ', 5, {
      mc: 'お二人を紹介し、あいさつへつなぐ。',
      sound: 'お二人へマイクを渡し、BGMを下げる。',
    }),
    program('toast', 'Toast', '乾杯', 5, {
      mc: '乾杯の方を紹介し、グラスをお持ちいただく。',
      caterer: '全卓のグラスを確認し、乾杯後に料理を出す。',
      photo: '乾杯の方と会場全体を撮影。',
    }),
    program('meal', 'Meal and conversation', '食事・歓談', 25, {
      caterer: '料理を提供。次の演出前に通路と配膳状況を確認。',
      photo: 'ゲストの自然な表情とお二人の交流を撮影。',
      sound: '会話しやすい音量でBGMを流す。',
    }),
    program('cake', 'Cake cutting and first bite', 'ケーキ入刀・ファーストバイト', 10, {
      planner: 'ナイフ、スプーン、ケーキ台を確認し、開始の合図。',
      caterer: 'ケーキを準備し、演出中は周辺の配膳を控える。',
      mc: 'ゲストに撮影位置を案内。入刀とファーストバイトを進行。',
      photo: 'お二人の表情と手元を撮影。',
      lighting: 'ケーキ台とお二人に明かりを合わせる。',
    }),
    program('exit', 'Exit for outfit change', '中座', 5, {
      mc: '中座の付き添いの方を紹介。お色直し中の流れを案内。',
      escort: '付き添いの方を案内し、お二人を控室へ誘導。',
      photo: '付き添いの方と退場する場面を撮影。',
    }),
    program('change', 'Outfit change', 'お色直し', 30, {
      escort: '着替えの進み具合を確認し、再入場口へ案内。',
      planner: '着付け・ヘア担当と残り時間を確認。遅れる場合は司会へ連絡。',
      mc: '上映後は歓談をご案内。再入場の合図を待つ。',
      caterer: '歓談中は配膳。映像の音が聞こえるよう上映中は作業音を抑える。',
    }, {
      durationOptions: [
        { minutes: 20, label: 'ドレスのみ（20分）' },
        { minutes: 30, label: 'ドレス＋ヘア調整（30分）' },
        { minutes: 40, label: 'ドレス＋ヘア変更（40分）' },
      ],
      subActivities: [
        program('film', 'Profile film during outfit change', 'プロフィール映像上映', 7, {
          sound: '映像音声を上げ、終了後に歓談BGMへ戻す。',
          lighting: '上映中は客席を落とし、終了後に戻す。',
        }, { startOffset: 0, projector: '司会の合図で再生。再生できない場合は進行担当に連絡。' }),
      ],
      coordinationNotesJa: '映像のあとは食事・歓談。上映はお色直しの時間に含みます。',
    }),
    program('reentry', 'Couple re-entry', '再入場', 5, {
      planner: 'お二人、司会、撮影、音響、照明の準備を確認して合図。',
      escort: '再入場口で衣装と歩くルートを確認。',
      photo: '新しい衣装とゲストの反応を撮影。',
      lighting: '扉が開いたらお二人を照らす。',
      sound: '合図で再入場曲を再生。',
    }),
    program('tables', 'Table visits and photos', 'テーブルラウンド・撮影', 15, {
      escort: '順番に各卓へご案内。',
      photo: '各卓の集合写真を撮影。',
      caterer: '撮影する卓への配膳は撮影後に回す。',
    }),
    program('game', 'Guest activity', 'ゲスト参加ゲーム', 10, {
      mc: 'ルールを短く説明し、時間内に結果を発表。',
      planner: '景品を用意。進行が遅れた場合は回数を減らす。',
      sound: '必要に応じてマイクと効果音を用意。',
    }, { isOptional: true }),
    program('buffer', 'Conversation and buffer', '歓談・予備時間', 5, {
      planner: '進行の遅れを調整し、謝辞と集合写真の準備を確認。',
    }),
    program('thanks', 'Couple thank-you speech', '新郎新婦の謝辞', 5, {
      mc: 'お二人からのお礼の言葉をご案内。',
      sound: 'マイクを用意。話し始めたらBGMを下げる。',
      photo: 'お二人とゲストの表情を撮影。',
    }),
    program('group', 'Group photo', '全員集合写真', 10, {
      mc: '集合場所を案内。',
      escort: 'ゲストを撮影場所に誘導。',
      photo: '並び順を整え、全員が写ることを確認。',
      lighting: '集合場所全体を明るくする。',
    }),
    program('farewell', 'Closing, exit and farewell', '閉会・退場・お見送り', 10, {
      mc: '閉会のあいさつとお見送り場所をご案内。',
      escort: 'お二人を出口へ案内し、ゲストの列を整理。',
      planner: 'お見送り終了時刻と会場の退館時刻を確認。',
      caterer: '忘れ物を確認し、会場と片付けの開始を合わせる。',
    }),
  ];
}
