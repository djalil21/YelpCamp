const User = require("../models/user")

module.exports.renderRegister = (req, res) => {
    res.render('users/register')
}

module.exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body
        const user = new User({ username, email })
        const createdUser = await User.register(user, password)
        req.login(createdUser, err => {
            if (err) return next(err)
            req.flash('success', `user ${username} created succesfully`)
            res.redirect('/campgrounds')
        })

    } catch (error) {
        req.flash('error', error.message)
        res.redirect('/register')
    }

}

module.exports.renderLogin = (req, res) => {
    res.render('users/login')
}

module.exports.login = (req, res) => {
    req.flash('success', `welcome back ${req.body.username}`);
    const redirectUrl = res.locals.returnTo || '/campgrounds';
    res.redirect(redirectUrl)
}

module.exports.logout = (req, res, next) => {
    req.logout(err => {
        if (err) {
            return next(err)
        }
        req.flash('success', 'log out successfully');
        res.redirect('/campgrounds')
    });

}