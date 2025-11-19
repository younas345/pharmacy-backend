import { authSchemas } from './authSchemas';
import { returnReportSchemas } from './returnReportSchemas';
import { commonSchemas } from './commonSchemas';

export const allSchemas = {
  ...authSchemas,
  ...returnReportSchemas,
  ...commonSchemas,
};

