from fastapi import Depends, HTTPException, Header
from firebase_admin import auth

def get_current_user(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    try:
        return auth.verify_id_token(token)
    except:
        raise HTTPException(status_code=401, detail="Invalid token")
