/**
 * SAMPLE syllabus units for demos, written to follow the shape of the Rwanda CBC syllabus.
 * Topics follow the usual REB order, but wording is ours, not the official text.
 * Replace with the official REB syllabus via POST /api/v1/syllabus/import (source "REB").
 */
import { CROSS_CUTTING_ISSUES as CCI, GENERIC_COMPETENCES as GC } from "../src/config/curriculum.js";

type SampleUnit = {
  number: number;
  title: string;
  keyUnitCompetence: string;
  content: string[];
  genericCompetences: string[];
  crossCuttingIssues: string[];
  term: number;
  suggestedPeriods: number;
  knowledge: string[];
  skills: string[];
  attitudes: string[];
};

const [critical, creativity, research, communication, cooperation, lifelong] = GC;
const [genocide, environment, gender, cse, peace, financial, standards, inclusive] = CCI;

function u(
  number: number,
  title: string,
  keyUnitCompetence: string,
  content: string[],
  genericCompetences: string[],
  crossCuttingIssues: string[],
  term = Math.min(3, Math.ceil(number / 2)),
  suggestedPeriods = 12,
): SampleUnit {
  return {
    number,
    title,
    keyUnitCompetence,
    content,
    genericCompetences,
    crossCuttingIssues,
    term,
    suggestedPeriods,
    knowledge: content.slice(0, 2).map((c) => `Explain ${c.charAt(0).toLowerCase()}${c.slice(1)}`),
    skills: content.slice(0, 2).map((c) => `Apply ${c.charAt(0).toLowerCase()}${c.slice(1)} in daily-life examples`),
    attitudes: ["Show confidence and cooperation when working in groups", "Appreciate accuracy and care in their work"],
  };
}

export const SAMPLE_SYLLABUS: Array<{ level: string; subject: string; units: SampleUnit[] }> = [
  // ---------- Mathematics, primary ----------
  { level: "P1", subject: "Mathematics", units: [
    u(1, "Whole numbers 0 to 20", "Count, read, write and compare whole numbers from 0 to 20.", ["Counting objects up to 20", "Reading and writing numerals", "Comparing numbers using more and less"], [critical, communication], [inclusive]),
    u(2, "Addition and subtraction within 20", "Add and subtract whole numbers within 20 using concrete objects.", ["Adding by counting on", "Subtracting by taking away", "Word problems with small numbers"], [critical, cooperation], [financial]),
    u(3, "Shapes around us", "Recognise and name basic 2D shapes in the environment.", ["Circles, squares, triangles and rectangles", "Sorting shapes", "Shapes in the classroom and home"], [creativity, communication], [environment]),
  ]},
  { level: "P2", subject: "Mathematics", units: [
    u(1, "Whole numbers 0 to 100", "Count, read, write, compare and order whole numbers up to 100.", ["Tens and ones", "Ordering numbers", "Number patterns"], [critical, communication], [inclusive]),
    u(2, "Addition and subtraction within 100", "Add and subtract whole numbers within 100 with and without regrouping.", ["Adding tens and ones", "Subtracting with regrouping", "Money problems in Rwandan francs"], [critical, research], [financial]),
    u(3, "Measuring length and mass", "Measure and compare length and mass using non-standard and standard units.", ["Comparing longer and shorter", "Using a metre and a kilogram", "Estimating"], [research, cooperation], [standards]),
  ]},
  { level: "P3", subject: "Mathematics", units: [
    u(1, "Whole numbers up to 1,000", "Read, write, compare and order whole numbers up to 1,000.", ["Hundreds, tens and ones", "Place value", "Rounding to the nearest ten"], [critical, communication], [inclusive]),
    u(2, "Multiplication and division", "Multiply and divide whole numbers using tables up to 10.", ["Multiplication as repeated addition", "Division as sharing", "Times tables"], [critical, cooperation], [financial]),
    u(3, "Fractions: equal parts", "Recognise, read and write simple fractions as equal parts of a whole.", ["Halves, quarters and thirds", "Comparing simple fractions", "Fractions of a group"], [critical, creativity], [gender, inclusive]),
    u(4, "Time and calendar", "Read time on a clock and use a calendar to plan activities.", ["Hours and half hours", "Days, weeks and months", "Planning with a calendar"], [lifelong, communication], [standards]),
  ]},
  { level: "P4", subject: "Mathematics", units: [
    u(1, "Whole numbers up to 100,000", "Read, write, compare and round whole numbers up to 100,000.", ["Place value", "Rounding", "Number patterns and sequences"], [critical, research], [financial]),
    u(2, "Fractions and decimals", "Add and subtract fractions with the same denominator and relate them to decimals.", ["Equivalent fractions", "Adding like fractions", "Tenths as decimals"], [critical, creativity], [inclusive]),
    u(3, "Perimeter and area", "Calculate the perimeter and area of rectangles and squares.", ["Perimeter of shapes", "Area using square units", "Problems about land and gardens"], [research, cooperation], [environment]),
  ]},
  { level: "P5", subject: "Mathematics", units: [
    u(1, "Operations on whole numbers", "Use the four operations on whole numbers to solve problems.", ["Long multiplication", "Long division", "Order of operations"], [critical, research], [financial]),
    u(2, "Fractions, decimals and percentages", "Convert between fractions, decimals and percentages and use them in problems.", ["Converting fractions to percentages", "Decimal operations", "Discounts and interest"], [critical, lifelong], [financial]),
    u(3, "Statistics", "Collect, organise and interpret data using tables and bar graphs.", ["Collecting data", "Tally and frequency tables", "Bar graphs"], [research, communication], [gender, environment]),
  ]},
  { level: "P6", subject: "Mathematics", units: [
    u(1, "Number theory", "Use factors, multiples, prime numbers, LCM and GCD to solve problems.", ["Prime and composite numbers", "LCM and GCD", "Divisibility rules"], [critical, research], [financial]),
    u(2, "Ratio and proportion", "Use ratio and proportion to solve real-life problems.", ["Simplifying ratios", "Direct proportion", "Sharing in a ratio"], [critical, cooperation], [financial, gender]),
    u(3, "Volume and capacity", "Calculate the volume of cubes and cuboids and relate it to capacity.", ["Volume in cubic units", "Litres and millilitres", "Water use problems"], [research, lifelong], [environment, standards]),
  ]},
  // ---------- Mathematics, lower secondary ----------
  { level: "S1", subject: "Mathematics", units: [
    u(1, "Number bases", "Convert numbers between base ten and other bases and operate in them.", ["Place value in other bases", "Converting between bases", "Binary numbers"], [critical, research], [standards]),
    u(2, "Algebraic expressions", "Simplify and evaluate algebraic expressions.", ["Like terms", "Substitution", "Expanding brackets"], [critical, creativity], [inclusive]),
    u(3, "Linear equations", "Form and solve linear equations in one unknown.", ["Solving one-step and two-step equations", "Word problems", "Checking solutions"], [critical, communication], [financial]),
  ]},
  { level: "S2", subject: "Mathematics", units: [
    u(1, "Simultaneous equations", "Solve simultaneous linear equations by elimination, substitution and graphs.", ["Elimination method", "Substitution method", "Graphical method"], [critical, research], [financial]),
    u(2, "Pythagoras theorem", "Use Pythagoras theorem to find lengths in right-angled triangles.", ["Proving the theorem", "Finding missing sides", "Applications in construction"], [critical, creativity], [standards]),
    u(3, "Statistics: measures of central tendency", "Calculate and interpret mean, median and mode.", ["Mean, median and mode", "Grouped data", "Interpreting results"], [research, communication], [gender]),
  ]},
  { level: "S3", subject: "Mathematics", units: [
    u(1, "Quadratic equations", "Solve quadratic equations by factorisation, completing the square and formula.", ["Factorisation", "Completing the square", "The quadratic formula"], [critical, research], [inclusive]),
    u(2, "Trigonometry", "Use sine, cosine and tangent ratios to solve problems on right-angled triangles.", ["Trigonometric ratios", "Angles of elevation and depression", "Problems with heights"], [critical, cooperation], [environment]),
    u(3, "Probability", "Calculate the probability of simple and combined events.", ["Experimental probability", "Theoretical probability", "Tree diagrams"], [critical, lifelong], [financial, cse]),
  ]},
  // ---------- English, primary ----------
  ...["P1", "P2", "P3", "P4", "P5", "P6"].map((level, i) => ({
    level,
    subject: "English",
    units: [
      u(1, i < 2 ? "Greetings and introductions" : "Talking about myself and my family", "Use simple English to greet, introduce themselves and talk about their family.", ["Greetings at different times of day", "Introducing self and others", "Family vocabulary"], [communication, cooperation], [peace, gender]),
      u(2, i < 2 ? "My school and classroom" : "Our community and its people", "Describe places and people in the school and community using correct vocabulary.", ["Naming places and objects", "Describing people's work", "Asking and answering questions"], [communication, research], [inclusive, environment]),
      u(3, i < 3 ? "Telling simple stories" : "Reading and writing short texts", "Read short texts with understanding and write simple sentences and paragraphs.", ["Reading for meaning", "Sentence structure", "Writing short paragraphs"], [communication, lifelong], [peace]),
    ],
  })),
  // ---------- Subjects taught by the demo teacher ----------
  { level: "P1", subject: "Kinyarwanda", units: [
    u(1, "Indamukanyo no kwimenyekanisha", "Gusuhuza no kwimenyekanisha mu Kinyarwanda kiboneye.", ["Indamukanyo zitandukanye", "Kwivuga izina n'umuryango", "Ikinyabupfura mu mvugo"], [communication, cooperation], [peace]),
    u(2, "Inyajwi n'ingombajwi", "Kumenya, gusoma no kwandika inyajwi n'ingombajwi z'ibanze.", ["Inyajwi a, e, i, o, u", "Ingombajwi z'ibanze", "Gusoma imigemo"], [communication, lifelong], [inclusive]),
    u(3, "Umuryango wanjye", "Kuvuga no gusobanura abagize umuryango n'inshingano zabo.", ["Abagize umuryango", "Inshingano mu rugo", "Uburinganire mu muryango"], [communication, cooperation], [gender, peace]),
  ]},
  { level: "P3", subject: "Social and Religious Studies", units: [
    u(1, "Our district", "Describe the location, leaders and main activities of their district.", ["Location of the district", "District leaders and their roles", "Economic activities"], [research, communication], [peace, financial]),
    u(2, "Environment and its conservation", "Explain ways of protecting the environment in their community.", ["Components of the environment", "Causes of environmental degradation", "Umuganda and conservation"], [critical, cooperation], [environment]),
    u(3, "Values and living together", "Show respect, honesty and unity in daily life.", ["Rwandan values", "Unity and reconciliation", "Resolving conflicts peacefully"], [cooperation, lifelong], [peace, genocide]),
  ]},
  { level: "P4", subject: "Creative Arts", units: [
    u(1, "Drawing and colour", "Create drawings that use lines, shapes and colour to express ideas.", ["Types of lines", "Primary and secondary colours", "Drawing from observation"], [creativity, communication], [environment]),
    u(2, "Rwandan songs and dance", "Perform Rwandan songs and dances with correct rhythm.", ["Traditional songs", "Rhythm and beat", "Intore and other dances"], [creativity, cooperation], [peace, gender]),
    u(3, "Crafts from local materials", "Make useful crafts from locally available materials.", ["Weaving with sisal and banana fibre", "Clay modelling", "Recycling materials"], [creativity, lifelong], [environment, financial]),
  ]},
  { level: "S3", subject: "History and Citizenship", units: [
    u(1, "Colonial rule in Rwanda", "Analyse the effects of colonial rule on Rwandan society.", ["German and Belgian rule", "Colonial administration", "Effects on Rwandan society"], [critical, research], [peace]),
    u(2, "The Genocide against the Tutsi", "Explain the causes, course and consequences of the 1994 Genocide against the Tutsi and how to prevent genocide.", ["Causes and planning", "Course and consequences", "Prevention and unity"], [critical, research], [genocide, peace]),
    u(3, "Human rights and responsibilities", "Explain human rights and the responsibilities that come with them.", ["Universal human rights", "Rights of the child", "Civic responsibilities"], [critical, communication], [gender, inclusive]),
  ]},
  { level: "S4", subject: "Biology", units: [
    u(1, "Cell structure and function", "Relate the structure of plant and animal cells to their functions.", ["Cell organelles", "Plant and animal cells", "Specialised cells"], [critical, research], [standards]),
    u(2, "Nutrition in plants", "Explain how plants make and use food through photosynthesis.", ["Photosynthesis", "Factors affecting photosynthesis", "Mineral nutrition"], [research, critical], [environment]),
    u(3, "Human reproductive health", "Explain human reproduction and make informed decisions about reproductive health.", ["Reproductive systems", "Puberty and adolescence", "STIs and HIV prevention"], [critical, lifelong], [cse, gender]),
  ]},
  // ---------- Science, upper primary ----------
  { level: "P5", subject: "Science and Elementary Technology", units: [
    u(1, "Plants and their uses", "Classify plants and explain their uses to people and the environment.", ["Parts of a plant", "Flowering and non-flowering plants", "Uses of plants"], [research, critical], [environment]),
    u(2, "Simple electric circuits", "Build simple electric circuits and explain how they work.", ["Conductors and insulators", "Series circuits", "Safety with electricity"], [creativity, critical], [standards]),
    u(3, "Personal hygiene and health", "Practise personal hygiene to prevent common diseases.", ["Hand washing", "Water-borne diseases", "Balanced diet"], [lifelong, cooperation], [cse, inclusive]),
  ]},
  { level: "P6", subject: "Science and Elementary Technology", units: [
    u(1, "The human body systems", "Describe the main human body systems and how to keep them healthy.", ["Digestive system", "Circulatory system", "Respiratory system"], [research, critical], [cse]),
    u(2, "Energy and its sources", "Identify sources of energy and explain how to use energy responsibly.", ["Renewable and non-renewable energy", "Solar energy in Rwanda", "Saving energy"], [critical, creativity], [environment, financial]),
    u(3, "Using ICT tools", "Use basic ICT tools safely to find and share information.", ["Parts of a computer", "Typing and saving work", "Online safety"], [communication, lifelong], [standards, inclusive]),
  ]},
];
