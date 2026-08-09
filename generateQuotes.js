const fs = require('fs');
const path = require('path');

const beginnings = [
    "The matrix wants you weak, but",
    "Amateurs sit and wait for inspiration, while",
    "Arrogance breeds complacency, whereas",
    "Discipline is doing what you hate to do, because",
    "You cannot escape the system if",
    "Suffering is a test, and",
    "Do not pray for an easy life, instead",
    "A man without a vision for his future",
    "The arrogant man thinks he knows everything, but",
    "Most people are not willing to do what it takes to win, so",
    "You are either building your own dream, or",
    "No one is coming to save you, which means",
    "Pain is temporary, but",
    "The universe rewards calculated risk, and",
    "If you are not where you want to be in life, it is because",
    "A comfort zone is a beautiful place, yet",
    "The only way to achieve the impossible is to believe it is possible, then",
    "Speed is extremely important in business; therefore,",
    "Embrace the suck, because",
    "You don't get what you wish for,",
    "While the masses seek comfort,",
    "True power is not given;",
    "If you want to be a master,",
    "Your mind is a weapon, so",
    "You must construct your own world, otherwise",
    "There is no limit to what you can achieve if",
    "You have to be willing to suffer if",
    "Outwork your self-doubt, and",
    "Success is the sum of small efforts, so",
    "When they sleep, you must grind, because",
    "Mediocrity is a disease, and",
    "Fear is an illusion created by the mind, but",
    "The weak complain about the storm, while",
    "If you want to conquer the world,",
    "Doubt kills more dreams than failure ever will, thus",
    "The only difference between you and the person you want to be is",
    "A warrior does not seek conflict, yet",
    "You are exactly where you deserve to be, unless",
    "To achieve greatness, you must first realize that",
    "The path of least resistance leads to nowhere, while",
    "Every second wasted is a victory for your enemies, so",
    "A strong body builds a strong mind, and",
    "Excuses are the nails used to build a house of failure, therefore",
    "The world owes you nothing, but",
    "If you want to live an extraordinary life,",
    "The fire inside must burn brighter than the fire around you, so",
    "Champions are forged in the fires of adversity, whereas",
    "The mind gives up long before the body does, which is why",
    "Every pain you feel is a weakness leaving the body, and",
    "The only easy day was yesterday, so"
];

const endings = [
    "you must get up and go to work.",
    "you have to spend more time on the mat than anyone else.",
    "the confident man knows he can learn anything.",
    "someone else is paying you to build theirs.",
    "you have to save yourself.",
    "quitting lasts forever.",
    "it punishes laziness and fear.",
    "you have not worked hard enough.",
    "nothing ever grows there.",
    "you must work until it is.",
    "the faster you move, the more you learn.",
    "you get what you work for.",
    "it is taken by force.",
    "you must keep it loaded.",
    "you will perish in the one constructed for you.",
    "you are willing to outwork everyone.",
    "you want to be great.",
    "prove everyone wrong.",
    "repeated day-in and day-out builds empires.",
    "the true test of life is endurance.",
    "you act like everyone else inside it.",
    "you change your actions to change your life.",
    "you must endure a difficult one.",
    "always returns to his past.",
    "the work you aren't doing remains undone.",
    "you must outwork the competition.",
    "the strong learn to dance in the rain.",
    "you must first conquer yourself.",
    "you must execute with absolute precision.",
    "he is always ready for war.",
    "the struggle is the only guarantee of growth.",
    "the hard path leads to glory.",
    "you must strike with relentless force.",
    "discipline is the only cure.",
    "you owe everything to yourself.",
    "you must abandon the desire for comfort.",
    "you must outshine the darkest nights.",
    "cowards are destroyed by it.",
    "you must master your own thoughts.",
    "you must push beyond your perceived limits.",
    "you must face tomorrow with unwavering resolve.",
    "you must do what you hate like you love it.",
    "you must become undeniable.",
    "you must break the chains of your own mind.",
    "you must embrace the chaos.",
    "you must stand firm when others fall.",
    "you must forge your own destiny.",
    "you must be relentless in your pursuit.",
    "you must crush the complacency within.",
    "you must rise above the noise.",
    "you must conquer the day before it conquers you.",
    "you must be the master of your own fate.",
    "you must leave a legacy of greatness.",
    "you must silence the inner critic.",
    "you must thrive in the discomfort.",
    "you must channel your anger into action.",
    "you must become the storm.",
    "you must outlast the pain.",
    "you must demand more from yourself.",
    "you must never accept defeat."
];

const authors = [
    "— Andrew Tate",
    "— David Goggins",
    "— Marcus Aurelius",
    "— Seneca",
    "— Unknown",
    "— Navy SEALs",
    "— Mike Tyson",
    "— Bruce Lee",
    "— Muhammad Ali",
    "— Sun Tzu",
    "— Epictetus",
    "— Miyamoto Musashi"
];

let quotes = [];

// Generate 50 * 60 = 3000 quotes
for (let i = 0; i < beginnings.length; i++) {
    for (let j = 0; j < endings.length; j++) {
        const text = `"${beginnings[i]} ${endings[j]}"`;
        // Deterministically pick an author so it doesn't shuffle on every build
        const author = authors[(i + j) % authors.length];
        quotes.push({ text: text, subtext: author });
    }
}

// Write to a JSON file
const outputPath = path.join(__dirname, 'src', 'data', 'quotes.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(quotes, null, 2));

console.log(`Successfully generated ${quotes.length} quotes!`);
