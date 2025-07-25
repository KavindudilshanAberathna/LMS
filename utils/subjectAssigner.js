// utils/subjectAssigner.js

function getSubjectsForGrade(grade, stream = null) {
  const commonSubjects_6_to_9 = [
    "Mathematics", "Science", "Sinhala", "English", "History",
    "Buddhism", "Health", "PTS", "Geography", "Tamil", "ICT", "Civil"
  ];

  const optionalSubjects_6_to_9 = [
    "Art", "Music", "Dancing", "Drama"
  ];

  const commonSubjects_10_11 = [
    "Mathematics", "Science", "Sinhala", "English", "History", "Buddhism"
  ];

  const optionalSubjects_10_11 = [
   "Commerce", "Tamil", "Geography", "Civil Education","Art","Dancing","Drama","Music","Health Science","ICT","Home Science"
];

  const streams_12_13 = {
    science: {
      common: ["General English", "General Information Technology"],
      optional: ["Physics", "Chemistry", "Biology", "Combined Mathematics"]
    },
    commerce: {
      common: ["General English", "General Information Technology"],
      optional: ["Accounting", "Business Studies", "Economics"]
    },
    arts: {
      common: ["General English", "General Information Technology"],
      optional: ["Logic", "Geography", "Political Science", "Media"]
    }
  };

  if (grade >= 6 && grade <= 9) {
    return { common: commonSubjects_6_to_9, optional: optionalSubjects_6_to_9 };
  } else if (grade === 10 || grade === 11) {
    return { common: commonSubjects_10_11, optional: optionalSubjects_10_11 };
  } else if (grade >= 12 && grade <= 13 && stream) {
    const lowerStream = stream.toLowerCase();
    if (streams_12_13[lowerStream]) {
      return {
        common: streams_12_13[lowerStream].common,
        optional: streams_12_13[lowerStream].optional
      };
    }
  }

  return { common: [], optional: [] };
}

// ✅ New function added here
function getAllSubjects() {
  const subjectsSet = new Set();

  // Include all subjects from each category
  [
    "Mathematics", "Science", "Sinhala", "English", "History",
    "Buddhism", "Health", "PTS", "Geography", "Tamil", "ICT", "Civil",
    "Art", "Music", "Dancing", "Drama",
    "Commerce", "Civil Education", "Health Science", "Home Science",
    "General English", "General Information Technology",
    "Physics", "Chemistry", "Biology", "Combined Mathematics",
    "Accounting", "Business Studies", "Economics",
    "Logic", "Political Science", "Media"
  ].forEach(subject => subjectsSet.add(subject));

  return Array.from(subjectsSet);
}

module.exports = {
  getSubjectsForGrade,
  getAllSubjects // ✅ make sure this is exported
};
