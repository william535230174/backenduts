const usersService = require('./users-service');
const { errorResponder, errorTypes } = require('../../../core/errors');

/**
 * Handle get list of users request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function getUsers(request, response, next) {
  try {
    const pageNum = parseInt (request.query.page_number) || null; 
    const pageSz = parseInt (request.query.page_size) || null; 
    const searchFld = request.query.search
      ? isValidSearchField (request.query.search.split (':') [0])
      : null; 
    
    const searchKy = request.query.search
      ? request.query.search.split(':')[1]
      : null; 

    const sortFld = request.query.sort
      ? isValidSortField(request.query.sort.split(':')[0])
      : 'email';
    
    const sortOrdr = request.query.sort
      ? isValidSortOrder(request.query.sort.split(':')[1])
      : 'asc';  

    const users = await usersService.getUsers(
      pageNum,
      pageSz,
      searchFld,
      searchKy,
      sortFld,
      sortOrdr
    ); 

    const sortedUsers = filteredUsers.sort((a, b) => {
      return sortOrder === 'asc'
        ? a[sortField].localeCompare(b[sortField])
        : b[sortField].localeCompare(a[sortField]);
    });

    // Calculate startIndex and endIndex based on pageNumber and pageSize
    const startIndex = (pageNum - 1) * pageSz;
    const endIndex = startIndex + pageSz;

    // Get users for the current page
    const usersForPage = sortedUsers.slice(startIndex, endIndex);

    // Calculate total pages
    const totalUsers = filteredUsers.length;
    const totalPages = Math.ceil(totalUsers / pageSz);

    // Determine if there are previous and next pages
    const hasPreviousPage = pageNum > 1;
    const hasNextPage = endIndex < totalUsers;

    // Construct response with pagination metadata and users for the current page
    const responseData = {
      page_number: pageNum,
      page_size: pageSz,
      count: filteredUsers.length,
      total_pages: totalPages,
      has_previous_page: hasPreviousPage,
      has_next_page: hasNextPage,
      users: usersForPage,
    };

    // Send response
    return response.status(200).json(responseData);
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle get user detail request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function getUser(request, response, next) {
  try {
    const user = await usersService.getUser(request.params.id);

    if (!user) {
      throw errorResponder(errorTypes.UNPROCESSABLE_ENTITY, 'Unknown user');
    }

    return response.status(200).json(user);
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle create user request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function createUser(request, response, next) {
  try {
    const name = request.body.name;
    const email = request.body.email;
    const password = request.body.password;
    const password_confirm = request.body.password_confirm;

    // Check confirmation password
    if (password !== password_confirm) {
      throw errorResponder(
        errorTypes.INVALID_PASSWORD,
        'Password confirmation mismatched'
      );
    }

    // Email must be unique
    const emailIsRegistered = await usersService.emailIsRegistered(email);
    if (emailIsRegistered) {
      throw errorResponder(
        errorTypes.EMAIL_ALREADY_TAKEN,
        'Email is already registered'
      );
    }

    const success = await usersService.createUser(name, email, password);
    if (!success) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to create user'
      );
    }

    return response.status(200).json({ name, email });
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle update user request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function updateUser(request, response, next) {
  try {
    const id = request.params.id;
    const name = request.body.name;
    const email = request.body.email;

    // Email must be unique
    const emailIsRegistered = await usersService.emailIsRegistered(email);
    if (emailIsRegistered) {
      throw errorResponder(
        errorTypes.EMAIL_ALREADY_TAKEN,
        'Email is already registered'
      );
    }

    const success = await usersService.updateUser(id, name, email);
    if (!success) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to update user'
      );
    }

    return response.status(200).json({ id });
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle delete user request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function deleteUser(request, response, next) {
  try {
    const id = request.params.id;

    const success = await usersService.deleteUser(id);
    if (!success) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to delete user'
      );
    }

    return response.status(200).json({ id });
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle change user password request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function changePassword(request, response, next) {
  try {
    // Check password confirmation
    if (request.body.password_new !== request.body.password_confirm) {
      throw errorResponder(
        errorTypes.INVALID_PASSWORD,
        'Password confirmation mismatched'
      );
    }

    // Check old password
    if (
      !(await usersService.checkPassword(
        request.params.id,
        request.body.password_old
      ))
    ) {
      throw errorResponder(errorTypes.INVALID_CREDENTIALS, 'Wrong password');
    }

    const changeSuccess = await usersService.changePassword(
      request.params.id,
      request.body.password_new
    );

    if (!changeSuccess) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to change password'
      );
    }

    return response.status(200).json({ id: request.params.id });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  changePassword,
};
