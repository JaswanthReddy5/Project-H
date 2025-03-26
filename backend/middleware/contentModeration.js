const inappropriateWords = [
  'girlfriend', 'boyfriend', 'dating', 'marriage', 'pay', 'money', 'rupees',
  'sex', 'sexual', 'adult', 'escort', 'prostitute', 'hooker', 'call girl',
  'massage', 'spa', 'body massage', 'happy ending'
];

const contentModeration = (req, res, next) => {
  const message = req.body.message?.toLowerCase() || '';
  
  // Check for inappropriate words
  const containsInappropriateContent = inappropriateWords.some(word => 
    message.includes(word.toLowerCase())
  );

  if (containsInappropriateContent) {
    return res.status(400).json({ 
      error: 'Message contains inappropriate content. Please keep the conversation professional and work-related.' 
    });
  }

  next();
};

module.exports = contentModeration; 