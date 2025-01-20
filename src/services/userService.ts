import * as userRepository from '../repositories/userRepository';
import * as tokenRepository from '../repositories/tokenRepository';
import * as authUtil from '../utils/authUtil';
import { User as IUser } from '../interfaces/user.interface';

export const signup = async (userInfo:any):Promise<boolean> => {
  try{
    if(await userRepository.selectUser(userInfo.email)) {
      return false
    }
    userInfo = await authUtil.createHashPassword(userInfo)
    await userRepository.createUser(userInfo)
    return true;
  }catch(err){
    throw new Error(`userService signup err: ${(err as Error).message}`)
  }
};

export const login = async (email: string, password: string):Promise<any> => {
  try{
    const userInfo = await userRepository.selectUser(email);
    if(userInfo && await authUtil.isMatchPassword(userInfo, password)){
      const accessToken = await authUtil.createAccessToken(userInfo)
      const refreshToken = await authUtil.createRefreshToken(userInfo)
      if (await tokenRepository.selectTokenByUid(userInfo.id)){
        await tokenRepository.deleteToken(userInfo.id)
      }
      await tokenRepository.createToken(userInfo.id, refreshToken);
      return {accessToken: accessToken, refreshToken: refreshToken};
    }
    return false
  }catch(err){
    throw new Error(`userService login Err: ${(err as Error).message}`)
  }
};

export const logout = async(userInfo: Record<string, any>) : Promise<boolean> => {
  try{
    await tokenRepository.deleteToken(userInfo.id)
    return true
  }catch(err){
    throw new Error(`userService logout Err: ${(err as Error).message}`);
  }
}

export const updateAccessToken = async(userInfo: IUser) : Promise<string>=> {
  try{
    const accessToken = await authUtil.createAccessToken(userInfo)
    return accessToken;
  }catch(err){
    throw new Error(`userService updateAccessToken Err: ${(err as Error).message}`)
  }
}

export const changePassword = async(email: string, password: string, newPassword: string) : Promise<boolean> => {
  try{
    const userInfo = await userRepository.selectUser(email);
    if(await authUtil.isMatchPassword(userInfo, password) && password !== newPassword){
      const salt = await authUtil.createRandomSalt()
      const newHashPassword = await authUtil.passwordChangeToHash(newPassword, salt)
      await userRepository.updatePassword(userInfo.id, newHashPassword, salt)
      return true
    }
    return false
  }catch(err){
    throw new Error(`userService changePassword Err: ${(err as Error).message}`)
  }
}

export const changeUserInfo = async(email: string, newName: string, newEmail: string) : Promise<boolean> => {
  try{
    const userInfo = await userRepository.selectUser(email);
    if(newName && newEmail){
      await userRepository.updateAllUserInfo(userInfo.id, newName, newEmail);
      return true
    }
    if(newName){
      await userRepository.updateName(userInfo.id, newName);
      return true
    }
    if(newEmail){
      await userRepository.updateEmail(userInfo.id, newEmail);
      return true
    }

    return false
  }catch(err){
    throw new Error(`userService changeUserInfo Err: ${(err as Error).message}`)
  }
}

export const deleteUser = async(email: string, password:string) : Promise<boolean> => {
  try{
    const userInfo = await userRepository.selectUser(email)
    if(await authUtil.isMatchPassword(userInfo, password)){
      await userRepository.deleteUser(userInfo)
      return true;
    }
    return false
  }catch(err){
    throw new Error(`userService deleteUser Err: ${(err as Error).message}`)
  }
}

export const myPage = async(email: string) : Promise<any> => {
  try{
    let userInfo = await userRepository.selectUser(email)
    userInfo = {...userInfo,
      id: userInfo.id,
      email: userInfo.email,
      createdAt: userInfo.createdAt,
      updatedAt: userInfo.updatedAt,
      provider: userInfo.provider
    }
    return userInfo
  }catch(err){
    throw new Error(`userService myPage Err: ${(err as Error).message}`)
  }
}

export const socialLogin = async (userInfo:any):Promise<any> => {
  try{
    
    let searchedUserInfo = await userRepository.selectUser(userInfo.email);
    
    if(searchedUserInfo) {
      return false
    }

    userInfo = await authUtil.createHashPassword(userInfo)
    await userRepository.createUser(userInfo)
    searchedUserInfo = await userRepository.selectUser(userInfo.email);

    const accessToken = await authUtil.createAccessToken(searchedUserInfo);
    const refreshToken = await authUtil.createRefreshToken(searchedUserInfo);
    if (await tokenRepository.selectTokenByUid(searchedUserInfo.id)){
      await tokenRepository.deleteToken(searchedUserInfo.id)
    }
    await tokenRepository.createToken(searchedUserInfo.id, refreshToken);
    
    return {accessToken: accessToken, refreshToken: refreshToken};
  }catch(err){
    throw new Error(`userService signup err: ${(err as Error).message}`);
  }
};