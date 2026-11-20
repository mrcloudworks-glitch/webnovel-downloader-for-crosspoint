#!/usr/bin/env node
/*
 * Builds HTML fixtures for the e2e harness from live-site captures:
 *   - https://libread.com/libread/cultivation-online-novel-110907          (novel page)
 *   - ...?ajax=chapters&page=1&pageSize=200                                (chapter list JSON)
 *   - https://libread.com/.../chapter-01, chapter-02  ->  301/302 to
 *   - https://freewebnovel.com/novel/cultivation-online-novel/chapter-1|2  (chapter text)
 *   - https://libread.com/search?searchkey=cultivation                     (search results)
 *   - https://libread.com/sort/latest-release-novel                        (browse listing)
 * Chapter paragraphs are the verbatim text captured from those pages; the DOM
 * structure (ids, classes, ads, watermarks, reader-order, nth-last-child promo
 * hider, wait-images, inline <h4> title) mirrors what WebToEpub's FreeWebNovel
 * parser, LNReader's libread filters and lightnovel-crawler's freewebnovel
 * template clean up on the real pages.
 *
 * Usage: node gen-fixtures.js [outDir]   (default /tmp/lr-fixtures)
 */
"use strict";
const fs = require("fs");
const path = require("path");

const OUT = process.argv[2] || "/tmp/lr-fixtures";
fs.mkdirSync(OUT, { recursive: true });

const NOVEL_URL = "https://libread.com/libread/cultivation-online-novel-110907";
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// ---------------------------------------------------------------- chapter 1 (verbatim, freewebnovel.com/novel/cultivation-online-novel/chapter-1)
const CH1 = [
  `"Brother! I got the game you wanted!" The teenager said cheerfully next to the young man laying on the bed. In her grasp was a large helmet that looked like a bike helmet, but with more of a sci-fi look.`,
  `The young man’s eyes were closed, seemingly asleep, but the girl continued to speak: "Here, let me help you put it on..."`,
  `The girl climbed on the large bed that could fit an entire family of four, and she lifted his head, putting the helmet she had prepared on his head.`,
  `"Thank you..." The young man finally spoke in a hoarse voice after she gently laid his head back down.`,
  `The girl smiled, tenderly caressing his hair so it wouldn’t bother him. "Brother, although I will be busy with school this week, next week for sure, I will play with you."`,
  `"Un..."`,
  `"I will come back later, so until then, have fun!" After those words, she went to touch the button on the side of the helmet and waited a few moments before leaving the young man alone.`,
  `—`,
  `It only took a few seconds after the button was pressed for the young man’s body in the real world to fall into a state similar to slumber. He could no longer smell the aroma that was unique to his room or feel the weight of the blanket pressing down on his body. Instead, he could feel himself standing, something he didn’t have the opportunity to experience for many years.`,
  `The world before him was mostly black, like the night sky without stars, and he could see white numbers floating above him, slowly counting down.`,
  `«10:01»`,
  `«10:00»`,
  `«09:59»`,
  `"I can see... I can feel my limbs... I... am no longer blind or a cripple..." The young man broke down in this darkness, becoming emotional and falling to his knees.`,
  `He was born with an incurable illness that left him blind at the age of 7 and crippled at the age of 13. He is now 18 years old, and for the past 5 years he would lay in his bed, unable to do anything else besides just laying there; it was a gruesome and unimaginable life that one wouldn’t even dare to imagine themselves in.`,
  `However, for this young man who has spent more than half of his life living in a world void of light, he was able to continue living without giving in to despair because of his caring younger sister, who supported him every day without any complaints.`,
  `"So this is the world’s first VRMMORPG with 100% immersion, huh."`,
  `When he first heard of the game from his younger sister, he almost couldn’t believe it.`,
  `A game that operates inside the mind of the individual, allowing that person to live in another world without the need to move a single limb — who would believe that such an incredible and advanced technology could exist? Not to mention that this high-tech technology was announced to be affordable enough for even the most common families to enjoy.`,
  `It was unimaginable at first, but experiencing it firsthand, the young man can only believe it.`,
  `«02:19»`,
  `«02:18»`,
  `The countdown continued to lower as the young man tries to familiarize himself with the feeling of moving his limbs. Although it was difficult at first, even tripping after every few steps, he gradually became familiarized with his body again.`,
  `«00:03»`,
  `«00:02»`,
  `«00:01»`,
  `«00:00»`,
  `«Welcome to Cultivation Online!»`,
  `As the system’s notice appeared, the black space quickly brightened, becoming a bright white room. And right before the young man, a crack appeared out of thin air, looking like a glass window being cracked.`,
  `Crack. Crack. Crack...`,
  `The crack grew larger and larger — until it was large enough for an adult to fit.`,
  `Suddenly, the large crack broke apart entirely, revealing the darkness behind it, and a beautiful woman with a graceful and elegant body slowly walked out from within the cracked space, looking like a goddess appearing from another world.`,
  `"This is..." The young man could only watch in a daze as the beautiful woman who just came out of the cracked space began looking at him from top to bottom with a seemingly cold expression on her otherwordly face. Dressed in unfamiliar red and golden robes, her figure was supple and graceful. Her facial features are sharp, symmetrical, and peerless. All in all, she looked like an otherworldly goddess. However, despite all of her perfect features, her gaze was anything but friendly.`,
  `She stared at him with her golden eyes that overflowed with a feeling of dominance, and her aura radiated with a tyrannical power that the young man cannot comprehend.`,
  `"Mortal, place your hand on this." The beauty spoke to him with a cold voice that was fitting for a ruler, and the young man watched as she pulled out a crystal ball from thin air.`,
  `"Okay." Believing that she was an NPC, the young man followed her instructions and placed his hand on the crystal ball without thinking about it too much, and words began appearing inside the crystal ball.`,
  `Name: ???`,
  `Cultivation: None`,
  `Legacy: None`,
  `Bloodline: None`,
  `Physique: Heaven Refining Physique`,
  `Physical Strength: 34`,
  `Mental Strength: 275`,
  `Soul Strength: 1,210`,
  `Physical Defense: 10`,
  `Mental Defense: 1,121`,
  `"?!?!" The beauty’s expression suddenly changed upon seeing the information in the crystal ball, her clear eyes filled with disbelief.`,
  `"Heaven Refining Physique!" Her hands trembled along with the crystal ball in her grasp. "Not to mention his Soul Strength is at the rank of Spirit Warrior despite being only a mortal with no cultivation — No, that is nothing when compared to his physique!"`,
  `The beauty has never been this shocked before, even to the point of her body trembling.`,
  `"Is something wrong?" The young man asked her upon seeing her silence and excited expression.`,
  `She lifted her head to look at him, thinking to herself: 'I must rope him into joining my faction before the others find him...'`,
  `"What is your name?" she asked him with a serious expression.`,
  `"You can call me Yuan."`,
  `"Take this token and keep it with you until we meet next time." The beauty retrieved a jade medallion from thin air and suddenly tossed it to him. "I don’t have much time left here. Make sure you don’t lose the token, I will see you again."`,
  `"Huh? Wait, I have some..." Before Yuan can even ask her any questions, the beauty walked back into the cracked hole, disappearing alongside the crack in the air.`,
  `"What an odd NPC. What should I do now?" He looked around the empty place.`,
  `«Character evaluation complete. Teleportation will occur in 10 seconds.»`,
  `«00:02»`,
  `«00:01»`,
  `As the timer reached zero, Yuan’s vision suddenly twisted, giving him a slight headache. When he blinked and opened his eyes, he found himself on some kind of stage where many people that wore the same white robe as him were gathered in a spacious area.`,
  `"This is... Cultivation Online?" His eyes widen when he saw mountains floating in the sky above the clouds and what appeared to be houses built on these floating mountains.`,
  `"Welcome, Mortals! I am Elder Song, in charge of making sure that before you all leave this place and adventure this vast world that you will have a goal of what you want to do here set in your mind." An old man in blue robes suddenly greeted everybody with a booming voice, causing everybody there to look above them.`,
  `"He’s flying! He is really flying while standing on that sword!" The people exclaimed the obvious.`,
  `Elder Song smiled and said: "I will answer your questions later, but first, let me explain to you about this world — the world of Cultivation."`,
  `"First and foremost, this is the Heavenly Continent, and we are currently at Mountain #96. Before you were transported here, everyone should have met a representative from our world that gave you an evaluation. That is your character status; it tells you almost everything about yourself."`,
  `"We will start with the basics. In this world, humans and monsters cultivate their bodies and mind with Spirit Qi that allows them to obtain supernatural powers. We call people like them Cultivators, and the higher the cultivation you reach, the stronger you will be in this world. Legacy and Bloodlines are special features that can be obtained later on if you are fortunate enough. As for Physique, everyone here should have one. Whether or not it is useless, this will tell you."`,
  `Elder Song waved his long sleeves and thousands of talisman flew towards the people there.`,
  `"Activate it with your thoughts," said Elder Song.`,
  `The crowd followed his instruction, and loud exclamations resounded soon afterward.`,
  `"It says that I have an Earth-ranked Physique! What does that mean?"`,
  `Elder Song looked at the young man who just spoke and said to him, "There is a one in ten thousand chances one is born with an Earth-rank Physique. Congratulations. You are what we call ’talented’."`,
  `"Elder, how many ranks of Physiques are there?"`,
  `"The rank for Physiques consists of Mortal, Earth, Heaven, and Divine."`,
  `"Elder, what does having a Mortal-rank Physique mean, and what is the difference between the ranks?"`,
  `Elder Song remained silent for a moment, before speaking with a grin, "Having a Mortal Physique means you are only ordinary, but having an Earth Physique means you are talented. The difference is obvious — you are naturally inferior to those who have a better physique than you! The more talented you are, the easier it will be for you as a Cultivator!"`,
  `His words caused many faces to sink, especially those with a Mortal Physique.`,
  `"Can our Physiques be changed?" Someone suddenly asked.`,
  `"Physiques can be changed, but the process is a long and painful one, so most people just accept their fate."`,
  `The people sighed in relief after hearing that their Mortal Physique can be changed.`,
  `"Does anyone here happen to have a Divine rank Physique?" Elder Song’s eyes flickered with expectation, but when nobody replied to his question the light in his eyes dimmed.`,
  `'The chances of someone having a Divine Physique is one in a hundred million, a genius above genius that knows no equal, so it isn’t surprising that such a prodigy wouldn’t appear amongst a mere thousand people.' He shook his head inwardly.`,
  `"Elder, I have a Heaven-ranked Physique." An individual suddenly said out loud, causing everybody there to look at him.`,
  `"Hoh? The chances of a Heaven Physique appearing is one in a million. You are a very fortunate one, young genius. What is your name?"`,
  `"My name is Shen Ming," replied the handsome young man.`,
  `"Shen Ming? Isn’t he the eldest son of Shen Li, the CEO of Royal Entertainment?"`,
  `Some people there recognized the handsome young man whose face looked exactly the same as he does in real life.`,
  `"Did you receive something from the representative who did your evaluation?" Elder Song asked him with great interest.`,
  `"Yes, I did." Shen Ming did not hide that fact and told him the truth. "I received this pouch from the representative."`,
  `"Oho... That is a storage pouch used to store items, there may be a few things in there that could benefit you. However, only cultivators are capable of using it. Additionally, if you can meet the person who gave you that gift again, they might even recruit you as a disciple for their Sect."`,
  `"Sect? You mean like guilds?"`,
  `"A Sect is a place created by one or a group of people for the purpose of nurturing its disciples to become powerful Cultivators — a school for Cultivators, basically." Elder Song briefly explained. "Is that it? Does nobody else have a Heaven Physique?"`,
  `After a moment of silence, Elder Song shook his head and thought to himself, 'What a pity that there is only one person out of the thousands here worth investing in. But even then, I don’t know who had given him that storage pouch. It’d be rude of me if I were to steal away their target, and I might even offend someone I cannot afford to offend.'`,
  `"I have one question for everybody here before I let you leave... What do you desire to achieve in this world? Strength? Status? Wealth? Handsome men? Beautiful women? Tell me, Mortals from another world!"`,
  `"I want to fly like you!"`,
  `"I wish for power!"`,
  `"I want to be famous!"`,
  `"I want enough money to make a mountain!"`,
  `"I want to walk around with beautiful women in both my arms!"`,
  `"I want handsome men to pamper me!"`,
  `Elder Song smiled upon hearing the masses’ desires. "If you want to survive in a world such as this, then you must have power! In this world, the strong rules the weak! Wealth and fame will naturally come if you are strong! People will flock to you if you are strong! Remember my words, young ones — this world looks down on the weak and the inferior, respecting only the strong! Having strength means you have everything!"`,
  `"Who do you think have the most power in this world?" Elder Song glanced at the people below with a narrowed gaze, sending chills down their spine.`,
  `"Cultivators! We, Cultivators, are a symbol of power, wealth, fame, and respect — we are the rule of this world!"`,
  `"Cultivators, is that some sort of class?" The people wondered.`,
  `"Elder, how do I become a Cultivator?"`,
  `Elder Song smiled. "It’s simple, really." He suddenly waved his sleeves, and thousands of glowing orbs appeared out of the blue and flew towards the people and directly at their forehead, submerging into their brain.`,
  `"I have just given you all the method to cultivate. It is now up to you to decide whether you want to cultivate or remain as a mortal." Elder Song waved his sleeves again, and four portals appear not too far away from the group. "Each portal represents a Continent. In this world, we have Four Great Continents not including this Heavenly Continent. Once you step inside, it will take you to a place within one of these Four Continents randomly, but even I will not know exactly where you’ll land so it is up to your fate."`,
  `«You have learned: Basic Qi Gathering Techniqiue»`,
  `«Rank: Mortal»`,
  `«Mastery Level: 1»`,
  `«Description: Absorbs 1 Qi every second. Can only be activated when sitting in the lotus position.»`,
  `"Now, scram. I have spent too much of my precious time dealing with you mortals. You will learn more about this world as you travel. Even if I use the remaining of my longevity, I won’t be able to explain to you everything about this world."`,
  `With another wave of his sleeve, everybody there began flying towards the portal as though they were being pulled towards them.`,
  `"Ahhhhh!!!"`,
  `Shocked cries resounded, and those who entered the portal would soon appear in this vast and unknown world at random.`,
  `—`,
  `After being thrown into the portal, Yuan felt the slight dizziness again, and before he was aware, he was in the middle of a forest.`,
  `"Where is this? Is there a map I can use?"`,
  `Suddenly, a large map with four large continents separated by water appears before him.`,
  `"Eastern Continent?" That was the only information he could gather from the map. Everything else was blacked out.`,
  `Yuan tilted his head to look at the bright sky and sighed. "I didn’t get to ask him about my Physique. That old man said that there only exist four ranks of Physiques: Mortal, Earth, Heaven, and Divine, so why does my Physique not belong to any one of these four ranks? Do I have a special body?"`,
  `In his grasp was a talisman with the following words on it:`,
  `«Heaven Refining Physique»`,
  `«Rank: Celestial»`,
];

// ---------------------------------------------------------------- chapter 2 (verbatim, .../chapter-2)
const CH2 = [
  `"Character status." Yuan activated the system command through his mind as he did with the talisman.`,
  { html: `<p>&lt;strong&gt;Name: Yuan&lt;/strong&gt;</p>`, text: `Name: Yuan` }, // literal escaped tags, decoded by the cleaner
  `Cultivation: None`,
  `Legacy: None`,
  `Bloodline: None`,
  `Physique: Heaven Refining Physique`,
  `Physical Strength: 34`,
  `Mental Strength: 275`,
  `Soul Strength: 1,210`,
  `Physical Defense: 10`,
  `Mental Defense: 1,121`,
  `"What do these stats do?" He pondered and pondered, but alas, without a guide or someone to teach him, he was clueless. "From what the creators of this game said, there will be no guides or manuals, leaving us, the players, to learn about this game for ourselves..."`,
  `"There should be a leveling system in these types of games, but where is the experience bar? What is my level? This feels more like reality than playing a game." Yuan opened and closed his hands into a fist.`,
  `Bang!`,
  `Suddenly, he punched a nearby tree.`,
  `"Ah! It really hurts! Does it hurt because this game is sending pain signals to my brain, making it believe that I am actually hitting a real tree? That’s... scary no matter how I think about it."`,
  `What if he got stabbed by a sword? What would that feel like? He didn’t want to think about it.`,
  `"Umm... excuse me, the brother over there..." A sweet voice suddenly resounded behind Yuan, making him turn his head.`,
  `"Huh?"`,
  `Standing right behind him was a cute little girl in red robes who looked to be around 10 years old, hugging a red ball in one arm and a book in the other.`,
  `'How did she get so close behind me without making a single sound? I didn’t even notice her presence! And what is such a young girl doing here, in the middle of nowhere? Perhaps there is a city nearby?' Yuan became curious.`,
  `"Are you an NPC or a Player?" He asked her, who tilted her head sideways with a puzzled expression.`,
  `"NPC? Player? Xiao Hua is Xiao Hua," replied the little girl.`,
  `"So your name is Xiao Hua, huh. My name is Yuan."`,
  `"How did Brother Yuan manage to get in here?" She suddenly asked him with a curious gaze, almost like it is her first time seeing another person in her life.`,
  `"Get in here? We are outside, aren’t we?"`,
  `She shook her head and said, "We are inside my family’s garden."`,
  `"Huh? Garden?" Yuan looked stupefied at her answer. "This forest is your garden...?"`,
  `She nodded.`,
  `If this place that looks like a forest is her family’s garden, then how big was the house itself? He couldn’t imagine it. While it sounded unbelievable, it also explained why such a small girl like her would appear here.`,
  `"Sorry for intruding, but I was teleported here by some old man against my will..." He tried to explain without sounding too crazy. "I’ll leave immediately, so can you tell me the way?"`,
  `But out of his expectations, the little girl shook her head. "Brother Yuan, since you are already here, why don’t you play with Xiao Hua?"`,
  `"You want me to play with you?" He did not expect such a request from her.`,
  `"Xiao Hua is always alone and it is boring to play with herself."`,
  `"What about your family?"`,
  `"They are always busy and cannot play with Xiao Hua."`,
  `"Is that so..." Yuan felt sorry for her. He himself would be an outcast if it were not for his younger sister, so he knew very well what it feels like to be alone.`,
  `"Okay, this big brother will play with you!" He patted his chest with confidence. Due to his illness that left him unable to move even a limb, he did not have the leisure to play with his younger sister when she was young, so he saw this as an opportunity to experience what it would be like if he wasn’t born with that illness.`,
  `"Really? You will play with Xiao Hua?" Her eyes glittered like the tiny stars in the sky, and her bright expression was adorable enough to soften the hearts of even the cruelest killers out there.`,
  `"Un. What do you want to play?"`,
  `"Then Xiao Hua will throw the ball to you, and you will throw it back, okay?" She placed the book down and showed him the ball.`,
  `"Let me get some distance... Okay, I am ready."`,
  `And without further ado, the two began playing throwing ball, and soon after, the merry laughter of a joyous little girl would echo in the forest.`,
  `—`,
  `While Yuan was spending his time entertaining a mysterious little girl, other Players would either be strengthening themselves or trying to gain more information about this world. Everybody rushed to surpass their friends and rivals in this new game that just came out, especially those who wish to become a professional and are required to be ahead of everybody else.`,
  `Minutes quickly turned into hours, and while everyone was grinding in their own ways, Yuan continued to play with the little girl.`,
  `'What monstrous stamina this little girl has! We have been throwing this ball back and forth for many hours, yet there is not a drop of sweat on her face! Even her small body shows no sign of fatigue!' Yuan smiled bittered, his entire body drenched in sweat. How could he, a young man, get worn out before a little girl that’s half his age while playing throwing ball? Although he has not moved a muscle for many years in the real world, this was virtual reality; he shouldn’t even be sweating, let alone feeling fatigued!`,
  `"What’s wrong, Brother Yuan? You do not look so good... Are you sick?" Xiao Hua’s words dealt significant damage to his pride.`,
  `"No... I am... just a bit... tired..." he said in an exhausted voice.`,
  `Hearing his words, she no longer threw the ball at him. "Then do you want to take a rest before we resume?"`,
  `"You... you still want to play?"`,
  `"Un!" she nodded vigorously, nearly making him cry.`,
  `"Okay... but let me rest for a bit..."`,
  `He sits down at a nearby tree, and Xiao Hua follows him, sitting beside him.`,
  `"Where is Brother Yuan from?" she asked.`,
  `"I am from a faraway place called Earth."`,
  `"Earth?"`,
  `Seeing her glittering eyes, Yuan smiled. "Do you want to hear about my homeland? Although it is not much, I still have memories of the places I went as a child."`,
  `"Yes! I want to hear stories about this Earth!"`,
  `"Very well, then..."`,
  `Yuan began telling stories to Xiao Hua of the things he has done as a child, and she quickly became engrossed in his stories.`,
  `After an hour of nonstop storytelling, when he ran out of both breaths and stories to tell her, Xiao Hua opens the book in her grasp and spoke, "Since Brother Yuan played with Xiao Hua and even told her stories, Xiao Hua shall also tell you stories," she said. "This is Xiao Hua’s gratitude to you, Brother Yuan!"`,
  `Yuan did not refuse and humbly accepted her appreciation.`,
  {
    // homoglyph sub-watermark inside the text (cleaner drops <sub> and its contents)
    html: `However, when she began reading the book in her hands, he was surprised to find out that he wasn’t able to understand<sub>ｌｉｂｒｅａｄ．ｃｏｍ</sub> a single word coming out of her mouth. It sounded more like chanting than a story!`,
    text: `However, when she began reading the book in her hands, he was surprised to find out that he wasn’t able to understand a single word coming out of her mouth. It sounded more like chanting than a story!`,
  },
  `But he didn’t want to be rude to her, so he continued to listen. Soon, without being aware, he closed his eyes. After closing his eyes, he began feeling more relaxed and comfortable, almost as though he was experiencing some kind of hypnotization.`,
  `The weird chanting from Xiao Hua became less gibberish — he was beginning to comprehend her words, and information he never knew was being fed into his head. This continued for a whole hour before a sharp sound would suddenly wake Yuan from his meditative state.`,
  `«You have learned Heaven’s Secret Art»`,
  `"Heaven’s Secret Art...?"`,
  `Xiao Hua smiled gently upon hearing Yuan’s mumble.`,
  `And suddenly, above the sky for every player to witness, a grand system notice appears.`,
  `«Player Yuan has become the world’s first player to have learned a Divine-rank Skill! Congratulations!»`,
  `The announcement shocked every witness there, especially those Players at the top. The game has not even been out for a day, yet someone has managed to obtain a Divine-rank Skill already? Who was this Player 'Yuan', and what did he do to obtain it?`,
];

const CHAPTERS = {
  1: { title: "Chapter 1 - Cultivation Online", paras: CH1 },
  2: { title: "Chapter 2 - Mysterious Little Girl", paras: CH2 },
};

// ---------------------------------------------------------------- chapter page HTML
// Structure mirrors freewebnovel.com: settings chrome + breadcrumbs outside,
// div.m-read > div.txt > div#article[data-reader-order=pending] holding the text,
// wait-image ad, inline <h4> title, SSP/PubFuture ads, watermark paragraph,
// a promo <p> hidden by p:nth-last-child(2){display:none} in <head>.
function chapterHtml(n) {
  const { title, paras } = CHAPTERS[n];
  const kids = [];
  kids.push(`<div id="bg-ssp-6327" style="order: 960">Advertisement: your ad here</div>`);
  kids.push(`<img src="https://freewebnovel.com/static/freewebnovel/images/media-state/wait-0${n}.webp" alt="" style="order: 950">`);
  kids.push(`<h4 style="order: 9">${esc(title)}</h4>`);
  let order = 10;
  paras.forEach((p, i) => {
    if (typeof p === "object" && p.html) { kids.push(`<p style="order: ${order}">${p.html.replace(/^<p>|<\/p>$/g, "")}</p>`); order += 2; return; }
    let html = esc(p);
    if (n === 1 && i === 31) html += `<span>ｆｒｅｅｗｅｂｎｏｖｅｌ．ｃｏｍ</span>`; // fullwidth homoglyph watermark
    kids.push(`<p style="order: ${order}">${html}</p>`);
    order += 2;
    if (i === 9) kids.push(`<div class="ads-wrapper" style="order: 961">Sponsored content</div>`);
    if (i === 44) kids.push(`<ins class="ad-slot" style="order: 962">Advertisement</ins>`);
  });
  kids.push(`<p>This story originates from a different website. Ensure the author gets the support they deserve by reading it there.</p>`);
  kids.push(`<p style="order: ${order}">Updates by Freewebnovel. com — visit us for more free novels like ${esc(title)}!</p>`);
  kids.push(`<div id="pf-1558-1" style="order: 963"><script>/* pubfuture bootstrap */</script>ad frame</div>`);
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta property="og:title" content="Cultivation Online - ${esc(title)} | Free Web Novel">
<title>Cultivation Online - ${esc(title)} | Free Web Novel</title>
<style>p:nth-last-child(2){display:none}</style>
<style>.ad-slot{color:#bbb}</style>
</head><body>
<div class="breadcrumb"><a href="/home" title="Free Web Novel">Home</a> &gt; <a href="/novel/cultivation-online-novel" title="Cultivation Online">Cultivation Online</a> &gt; ${esc(title)}</div>
<div class="settings">Background: Sepia | Font family: Arial | Font size: 16 | Line height: 140% | Reading width: Normal</div>
<div class="m-read">
  <div class="top-bar"><a href="/novel/cultivation-online-novel">Prev Chapter</a><a href="/novel/cultivation-online-novel/chapter-${n + 1}">Next Chapter</a></div>
  <div class="txt">
    <div id="article" data-reader-order="pending">
${kids.map((k) => "      " + k).join("\n")}
    </div>
  </div>
</div>
<div class="m-newest"><a href="/novel/cultivation-online-novel">[&lt;]</a> ${esc(title)} &nbsp; ${n} / 10</div>
<div class="footer-nav"><a href="/">Home</a> <a href="/novel/cultivation-online-novel">Info</a> <a href="/library">Library</a></div>
<div class="comments"><h3>Comments</h3><p>Posting Rules</p><p>CommentShare your thoughts about this novel or chapter.</p><p>0 / 1,000Spoiler Submit</p></div>
<script>window.__readerSettings = { background: "sepia" };</script>
</body></html>
`;
}

// ---------------------------------------------------------------- novel page HTML (libread.com)
const SUMMARY = [
  `Yuan was born with an incurable illness that left him blind at a young age and crippled a few years later, rendering everything below his head useless. Deemed hopeless and irredeemable, his parents quickly gave up on him, and the world ignored him.`,
  `In this dark and still world, his younger sister became his sole reason for living.`,
  `Watch as this young man reaches for the apex as a genius in Cultivation Online, the newest VRMMORPG, becoming a legendary figure in both worlds.`,
  `--------------------`,
  `Disclaimer: The MC is extremely overpowered and talented but also naive/innocent at first due to his illness. If you cannot wait for character developments and dislike OP MCs, this is not your cup of tea. Furthermore, the ’Earth’ in this novel is not the same Earth we are currently living on so do not use our common sense for this novel. This is pure fantasy, after all.`,
  `--------------------`,
  `Follow me on Instagram for Character Illustrations: @Webnovel_MLB`,
];
const GENRES = ["Adventure", "Comedy", "Romance", "Action", "Harem", "Game"];
const LIST_TITLES = [
  "Chapter 1 - Cultivation Online", "Chapter 2 - Mysterious Little Girl", "Chapter 3 - Becoming A Cultivator",
  "Chapter 4 - Hidden Ques", "Chapter 5 - Death Penalty", "Chapter 6 - Servants",
  "Chapter 7 - Heaven Splitting Sword Strike", "Chapter 8 - An Overwhelming Advantage",
  "Chapter 9 - Jade Frog", "Chapter 10 - A Natural Prodigy",
];
const chapHref = (i) => `/libread/cultivation-online-novel-110907/chapter-${String(i).padStart(2, "0")}`;

function novelHtml() {
  const idData = LIST_TITLES.slice(0, 5)
    .map((t, i) => `  <li><a href="${chapHref(i + 1)}" title="${esc(t)}"><span class="num"></span>${esc(t)}</a></li>`)
    .join("\n");
  const latest = LIST_TITLES.slice(5, 10).map((t, i) => i + 6)
    .reverse()
    .map((i) => `    <li><a href="${chapHref(i)}" title="${esc(LIST_TITLES[i - 1])}">${esc(LIST_TITLES[i - 1])}</a></li>`)
    .join("\n");
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta property="og:title" content="Cultivation Online | Lib Read">
<meta property="og:image" content="https://libread.com/files/article/image/1/1427/1427s.jpg">
<meta name="description" content="Yuan was born with an incurable illness that left him blind at a young age and crippled a few years later.">
<title>Cultivation Online | Lib Read</title></head><body>
<div class="m-imgtxt">
  <div class="pic"><img src="/files/article/image/1/1427/1427s.jpg" alt="Cultivation Online"></div>
  <div class="txt">
    <div class="item"><span class="glyphicon glyphicon-user" title="Author"></span><div class="right"><a href="/author/Mylittlebrother">Mylittlebrother</a></div></div>
    <div class="item"><span class="glyphicon glyphicon-th-list" title="Genre"></span><div class="right">${GENRES.map((g) => `<a href="/genre/${g}">${g}</a>`).join(", ")}</div></div>
    <div class="item"><span class="glyphicon glyphicon-flag" title="Status"></span><div class="right"><a href="/sort/latest-release-novel">OnGoing</a></div></div>
    <div class="item"><span class="glyphicon glyphicon-book" title="Type"></span><div class="right"><a href="/sort/latest-release/chinese-novel">Chinese Novel</a></div></div>
  </div>
</div>
<div class="m-desc">
  <h1 class="tit">Cultivation Online</h1>
  <div class="txt"><div class="inner">
${SUMMARY.map((p) => "    <p>" + esc(p) + "</p>").join("\n")}
  </div></div>
</div>
<div class="m-newest2"><h3>5 Latest Chapters[ Updated 13 hours ago ]</h3>
<ul>
${latest}
</ul></div>
<h3>Chapter List</h3>
<ul class="ul-list5" id="idData">
${idData}
</ul>
</body></html>
`;
}

// ---------------------------------------------------------------- ajax chapter list (verbatim JSON shape)
function chaptersJson() {
  const items = LIST_TITLES.map((t, i) =>
    `<li><a href="${chapHref(i + 1)}" title="${esc(t)}"><span class="num"></span>${esc(t)}</a></li>`).join("");
  return JSON.stringify({
    code: 200, html: items, page: 1, pageSize: 200, totalPage: 1, totalChapters: LIST_TITLES.length,
  });
}

// ---------------------------------------------------------------- search + browse listings
function card(href, title, cover, author, status, genres, blurb) {
  return `  <div class="con">
    <div class="pic"><img src="${cover}" alt="${esc(title)}"></div>
    <div class="txt">
      <h3><a href="${href}" title="${esc(title)}">${esc(title)}</a></h3>
      <div class="gat"><a href="/author/${esc(author)}">${esc(author)}</a></div>
      <div class="lbl">${status}</div>
      <div class="gen">${genres.map((g) => `<a href="/genre/${g}">${g}</a>`).join(", ")}</div>
      <p>${esc(blurb)}</p>
    </div>
  </div>`;
}
function searchHtml() {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>Search results for cultivation | Lib Read</title></head><body>
<div class="col-content">
${card("/libread/cultivation-online-novel-110907", "Cultivation Online", "/files/article/image/1/1427/1427s.jpg", "Mylittlebrother", "OnGoing", GENRES, SUMMARY[0])}
${card("/libread/the-extra-is-a-genius-62895", "The Extra Is a Genius", "/files/article/image/3/3606/3606s.jpg", "N/A", "Completed", ["Fantasy"], "An extra in the story turns out to be a genius.")}
${card("/libread/slime-evolution-89982", "Slime Evolution", "/files/article/image/5/5664/5664s.jpg", "N/A", "OnGoing", ["Adventure", "Fantasy"], "A slime evolves through countless forms.")}
</div>
</body></html>
`;
}
function browseHtml() {
  const item = (href, title, cover, status, genres) => `  <li><div class="item">
    <div class="pic"><img src="${cover}" alt="${esc(title)}"></div>
    <div class="txt"><h3 class="tit"><a href="${href}" title="${esc(title)}">${esc(title)}</a></h3>
    <div class="lbl">${status}</div>
    <div class="gen">${genres.map((g) => `<a href="/genre/${g}">${g}</a>`).join(", ")}</div></div>
  </div></li>`;
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>Latest Release Novels | Lib Read</title></head><body>
<ul class="ul-list1">
${item("/libread/cultivation-online-novel-110907", "Cultivation Online", "/files/article/image/1/1427/1427s.jpg", "OnGoing", GENRES)}
${item("/libread/the-extra-is-a-genius-62895", "The Extra Is a Genius", "/files/article/image/3/3606/3606s.jpg", "Completed", ["Fantasy"])}
${item("/libread/slime-evolution-89982", "Slime Evolution", "/files/article/image/5/5664/5664s.jpg", "OnGoing", ["Adventure"])}
</ul>
</body></html>
`;
}

// ---------------------------------------------------------------- write everything
fs.writeFileSync(path.join(OUT, "novel.html"), novelHtml());
fs.writeFileSync(path.join(OUT, "chapters.json"), chaptersJson());
fs.writeFileSync(path.join(OUT, "chapter-1.html"), chapterHtml(1));
fs.writeFileSync(path.join(OUT, "chapter-2.html"), chapterHtml(2));
fs.writeFileSync(path.join(OUT, "search.html"), searchHtml());
fs.writeFileSync(path.join(OUT, "browse.html"), browseHtml());
const coverSrc = "/home/user/image-search/cultivation-online-mylittlebrother-novel-1.jpg";
fs.copyFileSync(coverSrc, path.join(OUT, "1427s.jpg"));
// clean paragraph text for round-trip assertions (watermarks/ads excluded by construction)
const expectedText = (list) => list.map((p) => (typeof p === "object" ? p.text : p));
fs.writeFileSync(path.join(OUT, "expected-ch1.json"), JSON.stringify(expectedText(CH1), null, 1));
fs.writeFileSync(path.join(OUT, "expected-ch2.json"), JSON.stringify(expectedText(CH2), null, 1));
console.log("Fixtures written to " + OUT);
