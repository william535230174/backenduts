const { User } = require('../../../models');

/**
 * Get user by email for login information
 * @param {string} email - Email
 * @returns {Promise}
 */
async function getUserByEmail(email) {
  return User.findOne({ email });
}

async function resetAtt (email) { 
  let now = new Date (); 
  return User.updateOne ( 
    { email: email, 
    }, 
    { $set: { 
      attempt: 0, 
      }
    }
  )
}

async function loginAtt (email, attempt) { 
  let now = new Date (); 
  return User.updateOne ( 
    { email: email, 
    }, 
    { $set: { 
      updatedon: now, 
      attempt: attempt, 
      }
    }
  )
}

async function loginSuc (email) { 
  return User.updateOne ( 
    { email: email, 
    }, 
    { $set: { 
      attempt: 0, 
      }
    }
  )
}

module.exports = {
  getUserByEmail,
  resetAtt,
  loginAtt,
  loginSuc,
};
