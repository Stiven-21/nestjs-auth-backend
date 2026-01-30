import { COOKIE_OPTIONS } from 'src/common/constants/cookies.constants';
import { Request, Response } from 'express';
import { v7 as uuidv7 } from 'uuid';

export async function ensureDeviceId(
  req: Request,
  res: Response,
): Promise<string> {
  let deviceId = req.cookies?.['device_id'];

  if (!deviceId) {
    deviceId = uuidv7();
    res.cookie('device_id', deviceId, COOKIE_OPTIONS);
  }

  return deviceId;
}
