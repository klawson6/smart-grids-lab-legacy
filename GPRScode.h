//
// Created by kylel on 03/06/2019.
//

#ifndef RTW_HEADER_GPRScode_h_
#define RTW_HEADER_GPRScode_h_
#include "DSP2803x_Device.h"
#include <string.h>
//#include "cJSON.h"
#define NOERROR                        0                         /* no error*/
#define TIMEOUT                        1                         /* waiting timeout*/
#define DATAERR                        2                         /* data error (checksum error)*/
#define PRTYERR                        3                         /* parity error*/
#define FRAMERR                        4                         /* frame error*/
#define OVRNERR                        5                         /* overrun error*/
#define BRKDTERR                       6                         /* brake-detect error*/
#define RCVMAXRETRY                    10
#define RCVMAXCNTS                     1000
//#define RCVMAXCNTL                     5000000
#define SHORTLOOP                      0
#define LONGLOOP                       1
#define HELLO                          7                         /* test return */
int initConnection();
int uploadData(int DataArray[50]);
void buildData(int DataArray[50]);
int getCommand();
//int addRow(int x, cJSON *row, int DataArray[240]);
void initRxTx();
int RXresponse(char *rcvMsg, int lim);
int parseRX(char *rcvMsg);
int rxFunc(char *rcvMsg, int lim);
void txFunc(char* pmsg);
void errResponse(char *rcvMsg);

#endif //RTW_HEADER_GPRScode_h_

