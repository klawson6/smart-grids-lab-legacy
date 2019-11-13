//
// Created by kylel on 03/06/2019.
//
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include "GPRScode.h"
#include <stdint.h>
#include "DSP28x_Project.h"
#include "DSP2803x_Sci.h"
#include "DSP2803x_PieCtrl.h"
#include "DSP2803x_PieVect.h"
#include "DSP2803x_SysCtrl.h"

void initRxTx();

int initConnection();

int uploadData(int OUTPUT1, int OUTPUT2, int OUTPUT3, int OUTPUT4, int OUTPUT5, int Protection);

int RXresponse(char *rcvMsg);

int parseRX(char *rcvMsg);

int rxFunc(char *rcvMsg);

void txFunc(char *pmsg);

void scia_fifo_init();

void scia_echoback_init();

void errResponse(char *rcvMsg);

int connectStatus = 0; // No GPRS or Server connection
/*
 * Sends all AT commands required to establish a GPRS connection.
 * Each command waits for the previous command to have successfully been processed by the SIM800L by waiting for "OK" response.
 */
int initConnection() {
    initRxTx(); // Initialise registers required for SCI comms
    char rcvMsg[128]; // A buffer large enough to hold the response from the SIM800L (Could reduce)
    txFunc("AT\n\r\0"); // Handshake to ensure connection is stable
    if (RXresponse(rcvMsg) != 2) errResponse(rcvMsg); // Check the response is 'OK'
    else {
        txFunc("AT+CFUN=1\n\r\0"); // Set the SIM800L to full functionality
        if (RXresponse(rcvMsg) != 2) errResponse(rcvMsg); // Check the response is 'OK'
        else {
            txFunc("AT+SAPBR=3,1,\"APN\",\"giffgaff.com\"\n\r\0"); // Set APN parameters required for GPRS connection
            if (RXresponse(rcvMsg) != 2) errResponse(rcvMsg); // Check the response is 'OK'
            else {
                txFunc("AT+SAPBR=1,1\n\r\0"); // Set APN parameters required for GPRS connection. MAY LOOK LIKE IT STALLS IN TERMINAL BUT IS JUST SLOW
                if (RXresponse(rcvMsg) != 2) errResponse(rcvMsg); // Check the response is 'OK'
                else {
                    txFunc("AT+CSTT=\"giffgaff.com\",\"giffgaff\",\"\"\n\r\0"); // Set APN parameters required for GPRS connection
                    if (RXresponse(rcvMsg) != 2) errResponse(rcvMsg); // Check the response is 'OK'
                    else {
                        txFunc("AT+CIICR\n\r\0"); // Start GPRS connection
                        if (RXresponse(rcvMsg) != 2) errResponse(rcvMsg); // Check the response is 'OK'
                        else {
                            txFunc("AT+CIFSR\n\r\0"); // Check GPRS connection was established by getting IP address
                            if (RXresponse(rcvMsg) != 4) errResponse(rcvMsg); // Check the response is an IP address
                            else {
                                connectStatus = 1; // GPRS connection established.
                                return 1; // Success
                            }
                        }
                    }
                }
            }
        }
    }
    return 0; // Failure
}

int uploadData(int OUTPUT1, int OUTPUT2, int OUTPUT3, int OUTPUT4, int OUTPUT5, int Protection) {
    char rcvMsg[128]; // A buffer large enough to hold the response from the SIM800L (Could reduce)
    txFunc("AT\n\r\0"); // Handshake to ensure connection is stable
    if (RXresponse(rcvMsg) != 2) errResponse(rcvMsg); // Check the response is 'OK'
    else {
        txFunc("AT+HTTPINIT\n\r\0"); // Set the SIM800L to full functionality
        if (RXresponse(rcvMsg) != 2) errResponse(rcvMsg); // Check the response is 'OK'
        else {
            txFunc("AT+HTTPPARA=\"CID\",1\n\r\0"); // Set APN parameters required for GPRS connection
            if (RXresponse(rcvMsg) != 2) errResponse(rcvMsg); // Check the response is 'OK'
            else {
                txFunc("AT+HTTPPARA=\"URL\",\"http://vps692441.ovh.net/testGPRS.php\"\n\r\0"); // Set APN parameters required for GPRS connection. MAY LOOK LIKE IT STALLS IN TERMINAL BUT IS JUST SLOW
                if (RXresponse(rcvMsg) != 2) errResponse(rcvMsg); // Check the response is 'OK'
                else {
                    txFunc("AT+HTTPPARA=\"CONTENT\",\"application/x-www-form-urlencoded\"\n\r\0"); // Set APN parameters required for GPRS connection
                    if (RXresponse(rcvMsg) != 2) errResponse(rcvMsg); // Check the response is 'OK'
                    else {
                        txFunc("AT+HTTPDATA=120,30000\n\r\0"); // Start GPRS connection
                        if (RXresponse(rcvMsg) != 5) errResponse(rcvMsg); // Check the response is 'OK'
                        else {
                            char str[120];
                            sprintf(str,
                                    "BatteryVoltage=%u&PowerImport=%u&PowerExport=%u&DistributionVoltage=%u&LoadBusbar=%u&Protection=%u\n\r\0",
                                    OUTPUT1, OUTPUT2, OUTPUT3, OUTPUT4, OUTPUT5, Protection); // 91 chars
                            txFunc(str);
                            if (RXresponse(rcvMsg) != 2) errResponse(rcvMsg); // Check the response is 'OK'
                            else {
                                txFunc("AT+HTTPACTION=1\n\r\0");
                                int check1 = RXresponse(rcvMsg);
                                int check2 = RXresponse(rcvMsg);
                                if ((check1 == 2 || check2 == 2) && (check1 == 6 || check2 == 6)){
                                    txFunc("AT+HTTPREAD\n\r\0");
                                    rxFunc(rcvMsg);
                                    strcpy(str, rcvMsg);
                                    txFunc("AT+HTTPTERM\n\r\0");
                                    if (RXresponse(rcvMsg) != 2) errResponse(rcvMsg);
                                    else{
                                        txFunc("Server response:\n\r\0");
                                        txFunc(str);
                                        return 1; // Success
                                    }

                                } else
                                    errResponse(rcvMsg); // Check the response is 'OK'
                            }
                        }
                    }
                }
            }
        }
        return 0; // Failure
    }
}

/*
 * For debugging: Prints error message and response received to the Tx
 */
void errResponse(char *rcvMsg) {
    txFunc("Sad days\n\r\0");
    txFunc(rcvMsg);
}

/*
 * Calls relevant functions to setup RxTx GPIO pins in registers in correct way.
 */
void initRxTx() {
    InitSysCtrl();
    InitSciaGpio();
    DINT;
    InitPieCtrl();
    IER = 0x0000;
    IFR = 0x0000;
    InitPieVectTable();
    scia_fifo_init();
    scia_echoback_init();
}

//
// scia_echoback_init - Test 1,SCIA  DLB, 8-bit word, baud rate 0x000F,
// default, 1 STOP bit, no parity
//
void scia_echoback_init() {
    //
    // Note: Clocks were turned on to the SCIA peripheral in the InitSysCtrl()
    // function
    //

    //
    // 1 stop bit,  No loopback, No parity, 8 char bits, async mode,
    // idle-line protocol
    //
    SciaRegs.SCICCR.all = 0x0007;

    //
    // enable TX, RX, internal SCICLK, Disable RX ERR, SLEEP, TXWAKE
    //
    SciaRegs.SCICTL1.all = 0x0003;

    SciaRegs.SCICTL2.bit.TXINTENA = 1;
    SciaRegs.SCICTL2.bit.RXBKINTENA = 1;

    SciaRegs.SCIHBAUD = 0x0000;  // 9600 baud @LSPCLK = 15MHz (60 MHz SYSCLK)
    SciaRegs.SCILBAUD = 0x00C2;

    SciaRegs.SCICTL1.all = 0x0023;  // Relinquish SCI from Reset
}

//
// scia_fifo_init - Initialize the SCI FIFO
//
void scia_fifo_init() {
    SciaRegs.SCIFFTX.all = 0xE040;
    SciaRegs.SCIFFRX.all = 0x2044;
    SciaRegs.SCIFFCT.all = 0x0;
}

/*
 * Determine if it is safe to send next AT command after sending the previous.
 *
 * @return
 * Buffer overflow - 0 (Won't occur now as rxFunc has in built protection to read as much as possible ane no more. Handy for debugging however)
 * Neither overflow nor a recognised message occurred - 1
 * A recognised response - >=2
 */
int RXresponse(char *rcvMsg) {
    switch (rxFunc(rcvMsg)) { // Read in from Rx
        case 0:
            return parseRX(rcvMsg); // Check what the response is
        case 1:
            txFunc("OVERFLOW\n\r\0");
            return 0; // Response buffer overflow occurred, could not read SIM800L response. Tell Kyle to Increase buffer size!
    }
    return 1; // Neither overflow nor a recognised message occurred. Can't really occur but just in case
}

/*
 * Determine the response message from SIM800L
 * OK - 2
 * ERROR - 3
 * IP address - 4
 * Unrecognised message - 5
 */
int parseRX(char *rcvMsg) {
//    txFunc(rcvMsg);
    if (rcvMsg[2] == 'O' && rcvMsg[3] == 'K')
        return 2;
    else if (rcvMsg[2] == 'E' && rcvMsg[3] == 'R' && rcvMsg[4] == 'R' && rcvMsg[5] == 'O' && rcvMsg[6] == 'R')
        return 3;
    else if (rcvMsg[2] == '1')
        return 4;
    else if (rcvMsg[2] == 'D' && rcvMsg[3] == 'O' && rcvMsg[4] == 'W' && rcvMsg[5] == 'N')
        return 5;
    else if (rcvMsg[2] == '+' && rcvMsg[3] == 'H' && rcvMsg[4] == 'T' && rcvMsg[5] == 'T' && rcvMsg[6] == 'P' &&
             rcvMsg[7] == 'A')
        return 6;
    else
        return 7;
}


// Transmit character(s) from the SCIa
void txFunc(char *pmsg) {
    int i = 0;
    while (pmsg[i] != '\0') { // For every character except the terminator.
        while (SciaRegs.SCIFFTX.bit.TXFFST != 0) {} // While TX buffer is full, wait.
        SciaRegs.SCITXBUF = pmsg[i]; // Place next char in Tx Buffer to be sent
        i++;
    }
}

/*
 * Reads in chars from the Rx
 */
int rxFunc(char *rcvMsg) {
    char curChar = '\0'; // A char to represent the current value in the Rx buffer and to compare to.
    int i = 0; // A counter to count up to max value of chars to read in (127).
    int nCount = 0; // A counter for checking the head and tail '\n' of the response to stop read in from Rx.
    for (i = 0; i < 127 && nCount < 2; i++) { // While max chars not reached and tail '\n' not yet found.
        while (SciaRegs.SCIFFRX.bit.RXFFST != 1) {} // Wait for XRDY =1 for empty state
        curChar = (char) SciaRegs.SCIRXBUF.all;  // Get character
        rcvMsg[i] = curChar; // Append new char to rcvMsg buffer
        if (curChar == '\n') // Account for head/tail '\n\'
            nCount++;
    }
    rcvMsg[i] = '\0'; // Append a terminating character to the message buffer.
    return 0; // Return successfully read
}
