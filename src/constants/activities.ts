export type Activity = {
  id: string;
  name: string;
  nameEn?: string;
  nameJa?: string;
  nameMy?: string;
  duration: number; // in minutes
  isOptional: boolean;
  location?: string;
  style?: string; // e.g., 'Traditional', 'Western'
  details?: string;
  bgm?: string;
  isImportant?: boolean;
  needsMic?: boolean;
  onStage?: boolean;
  responsible?: string; // e.g., 'MC', 'Venue', 'Couple'
  coordinationNotes?: string;
  isPrep?: boolean;
  startOffset?: number;
  subActivities?: Activity[];
};

export type ActivityCategory = {
  name: string;
  activities: Activity[];
};

export const PREDEFINED_ACTIVITY_CATEGORIES: ActivityCategory[] = [
  {
    name: 'Preparation & Arrival',
    activities: [
      { 
        id: 'prep', 
        name: 'Venue Preparation', 
        nameEn: 'Venue Preparation',
        nameJa: '会場準備',
        nameMy: 'နေရာပြင်ဆင်ခြင်း',
        duration: 60, 
        isOptional: false, 
        responsible: 'Staff', 
        isPrep: true 
      },
      { 
        id: '1', 
        name: 'Reception', 
        nameEn: 'Reception',
        nameJa: '受付',
        nameMy: 'ဧည့်ခံ',
        duration: 30, 
        isOptional: false, 
        isImportant: true, 
        responsible: 'Venue' 
      },
      { id: 'p1', name: 'Bride & Groom Arrival', nameJa: '新郎新婦レストラン入り', nameMy: 'သတို့သားသတို့သမီး ရောက်ရှိ', duration: 10, isOptional: false, isPrep: true, responsible: 'Couple' },
      { id: 'p2', name: 'Champagne Brunch', nameJa: 'シャンパンブランチ', nameMy: 'ရှန်ပိန်ဘбранချီ', duration: 30, isOptional: false, isPrep: true, responsible: 'Venue' },
      { id: 'p3', name: 'Bride Prep Start', nameJa: '新婦お支度開始', nameMy: 'သတို့သမီး ပြင်ဆင်မှုစတင်', duration: 90, isOptional: false, isPrep: true, responsible: 'Makeup' },
      { id: 'p4', name: 'Hair & Makeup Finished', nameJa: '新郎新婦ヘアメイク仕上がり', nameMy: 'ဆံပင်နှင့် မိတ်ကပ် ပြီးစီး', duration: 0, isOptional: false, isPrep: true, responsible: 'Makeup' },
      { id: 'p5', name: 'Couple Photo Shoot', nameJa: 'お二人写真撮影（記念orスナップ）', nameMy: 'ဇနီးမောင်နှံ ဓာတ်ပုံရိုက်ကူးခြင်း', duration: 30, isOptional: false, isPrep: true, responsible: 'Photographer' },
      { id: 'p6', name: 'Bride Room Photo', nameJa: 'ブライズで撮影(撮影PLANに応じて）', nameMy: 'သတို့သမီးအခန်းတွင် ဓာတ်ပုံရိုက်ခြင်း', duration: 15, isOptional: false, isPrep: true, responsible: 'Photographer' },
      { id: 'p7', name: 'Relatives Receptionist Arrival', nameJa: '親族受付ご担当者様来館', nameMy: 'ဆွေမျိုးများ ဧည့်ကြို ရောက်ရှိ', duration: 0, isOptional: false, isPrep: true, responsible: 'Guests' },
      { id: 'p8', name: 'Ceremony Rehearsal', nameJa: '挙式リハーサル', nameMy: 'မင်္ဂလာပွဲ အစမ်းလေ့ကျင့်ခြင်း', duration: 20, isOptional: false, isPrep: true, responsible: 'MC/Staff' },
      { id: 'p9', name: 'Gold Plate Affixing', nameJa: 'ゴールドプレート貼りつけ', nameMy: 'ရွှေပြားကပ်ခြင်း', duration: 5, isOptional: false, isPrep: true, responsible: 'Couple' },
      { id: 'p10', name: 'Relatives Reception', nameJa: '親族受付', nameMy: 'ဆွေမျိုးများ ဧည့်ခံ', duration: 30, isOptional: false, isPrep: true, responsible: 'Receptionist' },
      { id: 'p11', name: 'Guest Reception', nameJa: 'ゲスト受付', nameMy: 'ဧည့်သည်များ ဧည့်ခံ', duration: 30, isOptional: false, isPrep: true, responsible: 'Receptionist' },
      { id: 'p12', name: 'Relatives Group Photo', nameJa: '親族集合写真（記念）', nameMy: 'ဆွေမျိုးများ စုပေါင်းဓာတ်ပုံ', duration: 15, isOptional: false, isPrep: true, responsible: 'Photographer' },
      { id: 'p13', name: 'Waiting for Entrance', nameJa: '入場待機', nameMy: 'ဝင်ရောက်ရန် စောင့်ဆိုင်းခြင်း', duration: 10, isOptional: false, isPrep: true, responsible: 'Couple' },
    ]
  },
  {
    name: 'Main Ceremony',
    activities: [
      { 
        id: '2', 
        name: 'Ceremony Start & Entrance', 
        nameEn: 'Ceremony Start & Entrance',
        nameJa: '開宴・新郎新婦入場',
        nameMy: 'ပွဲစတင်ခြင်းနှင့် သတို့သား၊ သတို့သမီး ဝင်ရောက်ခြင်း',
        duration: 5, 
        isOptional: false, 
        isImportant: true, 
        needsMic: true, 
        onStage: true, 
        responsible: 'MC' 
      },
      { 
        id: '6', 
        name: 'Ring Exchange', 
        nameEn: 'Ring Exchange',
        nameJa: '指輪交換',
        nameMy: 'လက်စွပ်လဲလှယ်ခြင်း',
        duration: 5, 
        isOptional: false, 
        onStage: true, 
        responsible: 'Couple' 
      },
      { 
        id: '7', 
        name: 'Love Speech', 
        nameEn: 'Love Speech',
        nameJa: '誓いの言葉',
        nameMy: 'Love Speech',
        duration: 5, 
        isOptional: false, 
        needsMic: true, 
        onStage: true, 
        responsible: 'Couple' 
      },
      { 
        id: '8', 
        name: 'Announcement of Marriage', 
        nameEn: 'Announcement of Marriage',
        nameJa: '結婚宣言',
        nameMy: 'မင်္ဂလာပွဲအောင်မြင်စွာပြီးမြောက်ကြောင်းကြေညာခြင်း',
        duration: 5, 
        isOptional: false, 
        needsMic: true, 
        onStage: true, 
        responsible: 'MC' 
      },
      { 
        id: '13', 
        name: 'Welcome Speech & Cheers', 
        nameEn: 'Welcome Speech & Cheers',
        nameJa: 'ウェルカムスピーチ・乾杯',
        nameMy: 'ကြိုဆိုနှုတ်ခွန်းဆက်စကားနှင့် Cheers',
        duration: 5, 
        isOptional: false, 
        needsMic: true, 
        onStage: true, 
        responsible: 'MC' 
      },
      { 
        id: '14', 
        name: 'Cake Cutting', 
        nameEn: 'Cake Cutting',
        nameJa: 'ケーキ入刀',
        nameMy: 'ကိတ်မုန့်လှီးဖြတ်ခြင်း',
        duration: 5, 
        isOptional: false, 
        onStage: true, 
        responsible: 'MC' 
      },
      { 
        id: '16', 
        name: 'Thank You Speech & Exit', 
        nameEn: 'Thank You Speech & Exit',
        nameJa: '謝辞・新郎新婦退場',
        nameMy: 'ကျေးဇူးတင်စကားနှင့် သတို့သား၊ သတို့သမီးထွက်ခွာခြင်း',
        duration: 5, 
        isOptional: false, 
        needsMic: true, 
        onStage: true, 
        responsible: 'Couple' 
      },
      { 
        id: 'exit', 
        name: 'Party End', 
        nameEn: 'Party End',
        nameJa: '新郎新婦退場',
        nameMy: 'Party End 新郎新婦退場',
        duration: 5, 
        isOptional: false, 
        isImportant: true, 
        onStage: true, 
        needsMic: true, 
        responsible: 'Couple' 
      },
      { id: 'c1', name: 'Civil Ceremony', nameJa: '人前式', nameMy: 'လူရှေ့သက်သေပြု မင်္ဂလာပွဲ', duration: 20, isOptional: false, isImportant: true, onStage: true, responsible: 'MC' },
      { id: 'c2', name: 'Flower/Ring Procession', nameJa: 'フラワー撒く人・指輪持つ人', nameMy: 'ပန်းကြဲသူ / လက်စွပ်သယ်သူ', duration: 5, isOptional: false, onStage: true, responsible: 'Guests' },
      { id: 'c3', name: 'Vows', nameJa: '誓いの言葉', nameMy: 'သစ္စာဆိုခြင်း', duration: 5, isOptional: false, needsMic: true, onStage: true, responsible: 'Couple' },
      { id: 'c4', name: 'Ring Reveal', nameJa: 'リングお披露目', nameMy: 'လက်စွပ်ပြသခြင်း', duration: 3, isOptional: false, onStage: true, responsible: 'Couple' },
      { id: 'c5', name: 'Sign Certificate', nameJa: '結婚証明書サイン', nameMy: 'လက်မှတ်ရေးထိုးခြင်း', duration: 5, isOptional: false, onStage: true, responsible: 'Couple' },
      { id: 'c6', name: 'Show Certificate', nameJa: '結婚証明書披露', nameMy: 'လက်မှတ်ပြသခြင်း', duration: 3, isOptional: false, onStage: true, responsible: 'Couple' },
      { id: 'c7', name: 'Applause', nameJa: '承認の拍手', nameMy: 'လက်ခုပ်တီး အသိအမှတ်ပြုခြင်း', duration: 2, isOptional: false, onStage: true, responsible: 'Guests' },
      { id: 'c8', name: 'Closing Words', nameJa: '閉会の言葉', nameMy: 'နိဂုံးချုပ်စကား', duration: 3, isOptional: false, needsMic: true, onStage: true, responsible: 'MC' },
      { id: 'c9', name: 'Ceremony Exit', nameJa: '新郎新婦退場', nameMy: 'သတို့သားသတို့သမီး ထွက်ခွာခြင်း', duration: 5, isOptional: false, isImportant: true, onStage: true, responsible: 'Couple' },
    ]
  },
  {
    name: 'Burmese Traditional Ceremony',
    activities: [
      { 
        id: '3', 
        name: 'Su Lya Yit Pat', 
        nameEn: 'Su Lya Yit Pat',
        nameJa: 'スーリャ・イッ・パッ (ミャンマー伝統儀式)',
        nameMy: 'စုလျားရစ်ပတ်',
        duration: 15, 
        isOptional: true, 
        onStage: true, 
        responsible: 'Couple' 
      },
      { 
        id: '4', 
        name: 'Traditional Greeting', 
        nameEn: 'Traditional Greeting',
        nameJa: 'ミャンマー伝統の挨拶',
        nameMy: 'မြန်မာ့ရိုးရာနှုတ်ဆက်ဂါရဝပြုခြင်း',
        duration: 10, 
        isOptional: false, 
        onStage: true, 
        responsible: 'Couple' 
      },
      { 
        id: '5', 
        name: 'Water Pouring & Garland', 
        nameEn: 'Water Pouring & Garland',
        nameJa: '水合わせ・花輪の儀式',
        nameMy: 'ရေစင်သွန်း ၊ ပန်းကုံးစွပ် စသည့်စုလျားရစ်ပတ်မင်္ဂလာ',
        duration: 5, 
        isOptional: false, 
        onStage: true, 
        responsible: 'Couple' 
      },
    ]
  },
  {
    name: 'Reception & Entertainment',
    activities: [
      { 
        id: '9', 
        name: 'Meal & Conversation', 
        nameEn: 'Meal & Conversation',
        nameJa: '食事・歓談',
        nameMy: 'အစားအသောက်နှင့် နှုတ်ဆက်စကားပြောဆိုခြင်း',
        duration: 45, 
        isOptional: false, 
        responsible: 'Venue' 
      },
      { 
        id: '12', 
        name: 'Video & Performance', 
        nameEn: 'Video & Performance',
        nameJa: '映像上映・余興',
        nameMy: 'ဗီဒီယိုပြသခြင်းနှင့် ဖျော်ဖြေတင်ဆက်မှု',
        duration: 5, 
        isOptional: false, 
        onStage: true, 
        responsible: 'Tech' 
      },
      { 
        id: '15', 
        name: 'Games & Entertainment', 
        nameEn: 'Games & Entertainment',
        nameJa: '余興・ゲーム',
        nameMy: 'ဖျော်ဖြေတင်ဆက်မှုနှင့်ဂိမ်းများ',
        duration: 15, 
        isOptional: true, 
        needsMic: true, 
        onStage: true, 
        responsible: 'MC' 
      },
      { 
        id: '17', 
        name: 'Bouquet Toss & Group Photo', 
        nameEn: 'Bouquet Toss & Group Photo',
        nameJa: 'ブーケトス・集合写真',
        nameMy: 'Bouquet toss & စုပေါင်းဓာတ်ပုံရိုက်ကူးခြင်း',
        duration: 10, 
        isOptional: false, 
        responsible: 'MC' 
      },
      { 
        id: '18', 
        name: 'Seeing off Guests (Petit Gift)', 
        nameEn: 'Seeing off Guests (Petit Gift)',
        nameJa: '送賓 (プチギフト)',
        nameMy: 'ဧည့်သည်များကို ပြန်လည်ပို့ဆောင်ခြင်း (プチギフトဖြင့်)',
        duration: 30, 
        isOptional: false, 
        isImportant: true, 
        responsible: 'Couple' 
      },
      { 
        id: 'leave', 
        name: 'Couple Exit Venue', 
        nameEn: 'Couple Exit Venue',
        nameJa: '新郎新婦退館',
        nameMy: '新郎新婦退館',
        duration: 10, 
        isOptional: false, 
        responsible: 'Couple' 
      },
      { id: 'r1', name: 'Waiting for Re-entry', nameJa: '新郎新婦入場待機', nameMy: 'ပြန်လည်ဝင်ရောက်ရန် စောင့်ဆိုင်းခြင်း', duration: 10, isOptional: false, responsible: 'Couple' },
      { id: 'r2', name: 'Entrance Prep', nameJa: '入場準備', nameMy: 'ဝင်ရောက်ရန် ပြင်ဆင်ခြင်း', duration: 5, isOptional: false, responsible: 'Staff' },
      { id: 'r3', name: 'Reception Start', nameJa: '披露宴スタート', nameMy: 'ဧည့်ခံပွဲ စတင်', duration: 5, isOptional: false, isImportant: true, needsMic: true, responsible: 'MC' },
      { id: 'r4', name: 'Couple Entrance', nameJa: '新郎新婦入場', nameMy: 'သတို့သားသတို့သမီး ဝင်ရောက်ခြင်း', duration: 5, isOptional: false, isImportant: true, onStage: true, responsible: 'Couple' },
      { id: 'r5', name: 'Meal Start', nameJa: 'お料理スタート', nameMy: 'အစားအသောက် စတင်', duration: 5, isOptional: false, responsible: 'Venue' },
      { id: 'r6', name: 'Speech 1', nameJa: 'スピーチ①', nameMy: 'စကားပြော ၁', duration: 5, isOptional: false, needsMic: true, onStage: true, responsible: 'Guest' },
      { id: 'r7', name: 'Speech 2', nameJa: 'スピーチ②', nameMy: 'စကားပြော ၂', duration: 5, isOptional: false, needsMic: true, onStage: true, responsible: 'Guest' },
      { id: 'r8', name: 'Speech 3', nameJa: 'スピーチ③', nameMy: 'စကားပြော ၃', duration: 5, isOptional: false, needsMic: true, onStage: true, responsible: 'Guest' },
      { id: 'r9', name: 'Bride Exit (Change)', nameJa: '新婦中座', nameMy: 'သတို့သမီး ဝတ်စုံလဲရန် ထွက်ခွာ', duration: 15, isOptional: false, responsible: 'Bride' },
      { id: 'r10', name: 'Groom Exit (Change)', nameJa: '新郎中座', nameMy: 'သတို့သား ဝတ်စုံလဲရန် ထွက်ခွာ', duration: 15, isOptional: false, responsible: 'Groom' },
      { id: 'r11', name: 'Profile Video', nameJa: 'プロフィールＶＴＲ上映', nameMy: 'ကိုယ်ရေးအကျဉ်း ဗီဒီယို', duration: 5, isOptional: false, onStage: true, responsible: 'Tech' },
      { id: 'r12', name: 'Re-entry after Video', nameJa: '映像より続けてお二人再入場', nameMy: 'ဗီဒီယိုအပြီး ပြန်လည်ဝင်ရောက်ခြင်း', duration: 5, isOptional: false, onStage: true, responsible: 'Couple' },
      { id: 'r13', name: 'First Bite', nameJa: 'ファーストバイト', nameMy: 'ပထမဆုံး ခွံ့ကျွေးခြင်း', duration: 5, isOptional: false, onStage: true, responsible: 'Couple' },
      { id: 'r14', name: 'Table Photo Round', nameJa: 'カミングフォト', nameMy: 'စားပွဲဝိုင်း ဓာတ်ပုံရိုက်ခြင်း', duration: 20, isOptional: false, responsible: 'Couple/Photo' },
      { id: 'r15', name: 'Group Photo', nameJa: '全員写真', nameMy: 'စုပေါင်းဓာတ်ပုံ', duration: 10, isOptional: false, onStage: true, responsible: 'Photo' },
      { id: 'r16', name: 'Photo Free Time', nameJa: 'フォトフリータイム', nameMy: 'လွတ်လပ်စွာ ဓာတ်ပုံရိုက်ချိန်', duration: 15, isOptional: false, responsible: 'Guests' },
      { id: 'r17', name: 'Bride Letter', nameJa: '新婦手紙朗読', nameMy: 'သတို့သမီး စာဖတ်ခြင်း', duration: 5, isOptional: false, needsMic: true, onStage: true, responsible: 'Bride' },
      { id: 'r18', name: 'Gift Presentation', nameJa: '記念品贈呈', nameMy: 'လက်ဆောင်ပေးအပ်ခြင်း', duration: 5, isOptional: false, onStage: true, responsible: 'Couple' },
      { id: 'r19', name: 'Acknowledgment 1', nameJa: '謝辞①', nameMy: 'ကျေးဇူးတင်စကား ၁', duration: 3, isOptional: false, needsMic: true, onStage: true, responsible: 'Guest' },
      { id: 'r20', name: 'Acknowledgment 2 (Groom)', nameJa: '謝辞②新郎', nameMy: 'ကျေးဇူးတင်စကား (သတို့သား)', duration: 3, isOptional: false, needsMic: true, onStage: true, responsible: 'Groom' },
      { id: 'r21', name: 'Parents Exit', nameJa: 'ご両親退場', nameMy: 'မိဘများ ထွက်ခွာ', duration: 5, isOptional: false, responsible: 'Parents' },
      { id: 'r22', name: 'Sending Off End', nameJa: '送賓終了', nameMy: 'ဧည့်သည်ပို့ဆောင်ခြင်း ပြီးဆုံး', duration: 0, isOptional: false, isImportant: true, responsible: 'Staff' },
      { id: 'r23', name: 'Return to Bride Room', nameJa: '新郎新婦ブライズルームへ戻ります', nameMy: 'သတို့သမီးအခန်းသို့ ပြန်ခြင်း', duration: 5, isOptional: false, responsible: 'Couple' },
      { id: 'r24', name: 'After Dine', nameJa: 'アフターダイン', nameMy: 'ပွဲပြီး စားသောက်ခြင်း', duration: 30, isOptional: false, responsible: 'Couple' },
      { id: 'lib1', name: 'Meal START!', nameJa: '食事START!', nameMy: 'အစားအသောက် စတင်!', duration: 5, isOptional: false, responsible: 'Venue' },
      { id: 'lib2', name: 'Re-entry', nameJa: '再入場', nameMy: 'ပြန်လည်ဝင်ရောက်ခြင်း', duration: 5, isOptional: false, isImportant: true, onStage: true, responsible: 'Couple' },
      { id: 'lib3', name: 'Bride & Groom Profile Introduction', nameJa: '新郎新婦プロフィール紹介', nameMy: 'သတို့သားသတို့သမီး ကိုယ်ရေးအကျဉ်း မိတ်ဆက်', duration: 10, isOptional: false, needsMic: true, onStage: true, responsible: 'MC' },
      { id: 'lib4', name: 'Photo Time', nameJa: '写真タイム', nameMy: 'ဓာတ်ပုံရိုက်ချိန်', duration: 15, isOptional: false, responsible: 'Guests' },
    ]
  },
  {
    name: 'Photos & Transitions',
    activities: [
      { 
        id: '10', 
        name: 'Group Photos', 
        nameEn: 'Group Photos',
        nameJa: 'グループ写真',
        nameMy: 'အဖွဲ့လိုက်ဓာတ်ပုံရိုက်ချိန်',
        duration: 10, 
        isOptional: false, 
        onStage: true, 
        responsible: 'Photographer' 
      },
      { 
        id: '11', 
        name: 'Costume Change', 
        nameEn: 'Costume Change',
        nameJa: 'お色直し',
        nameMy: 'သတို့သား၊ သတို့သမီး ဝတ်စုံလဲလှယ်ရန် ခေတထွက်ခွာခြင်း',
        duration: 30, 
        isOptional: true, 
        isImportant: true, 
        responsible: 'Couple' 
      },
    ]
  }
];
