const successResponse = (res, message, data = null, status = 200) => {
    return res.status(status).json({
        status,
        message,
        data
    });
};

const errorResponse = (res, message, status = 400) => {
    return res.status(status).json({
        status,
        message
    });
};

module.exports = {
    successResponse,
    errorResponse
};
