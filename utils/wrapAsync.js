module.exports = fn => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    }
} //to avoid try/catch every time