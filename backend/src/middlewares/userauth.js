const jwt = require("jsonwebtoken");
const User = require("../modles/user");


const userauth = async (req,res,next)=>{
    try {
        const {token} = req.cookies;
        if(!token){
            res.status(401).send("pls login!!")
        }
    
        const decoded = await jwt.verify(token,"secretkey"); 
    
        const {_id} = decoded;
    
        const user =await User.findOne({_id});
        if(!user){
            throw new Error (" Unauthorized : user not found");
        }
        req.user = user;
        next();
    } catch (error) {
        res.status(401).send(" something went wrong : "+ error.message);
    }
    
}



module.exports ={ userauth}