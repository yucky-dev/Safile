import { Router, type IRouter } from "express";
import healthRouter from "./health";
import ehrConnectorsRouter from "./ehr-connectors";
import encryptionKeysRouter from "./encryption-keys";
import indexdNodesRouter from "./indexd-nodes";
import backupsRouter from "./backups";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(ehrConnectorsRouter);
router.use(encryptionKeysRouter);
router.use(indexdNodesRouter);
router.use(backupsRouter);
router.use(statsRouter);

export default router;
