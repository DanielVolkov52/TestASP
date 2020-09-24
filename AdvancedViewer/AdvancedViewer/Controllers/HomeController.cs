using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Web;
using System.Web.Mvc;
using cadex;
using AdvancedViewer.CAD_API;

namespace AdvansedViewer.Controllers
{

    public class HomeController : Controller
    {
        [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        static extern bool SetDllDirectory(string lpPathName);
        public ActionResult Index()
        {
            CADEX_initializer.Init("@CUSTOMER=EVAL @CUSTOMER_APP=EVAL @PRODUCT=ANY @OS=ANY @CONFIGURATION=ANY @VERSI" +
                "ON=ANY @SERIAL_NUMBER=ZM3M-41RT-K2H8-8C5W @UPGRADE_EXPIRATION=20210904 @USE_EXPI" +
                "RATION=20210904 @VENDOR=http://www.cadexchanger.com @WARNING=This license key ma" +
                "y not be disclosed to any third party without prior written permission from vend" +
                "or. LTNE5PAKN3XCBYMCMDY1IYPMNLCMX1IYB5TWA3HD6UPHTRTV47CM61O930WGIEUTZN59RM2XHRVQ" +
                "Y412CEOYVS7YSJEQX9JCW513R3HOACU8WWAOQEMLMAKFTE5735JGALJH406FSGNPCET28G4V6OQZIBMM" +
                "B9O5H99S37BVAEOI8VU2ABHBEFQPA72J7Y96N9GCIQF4DROI4P8NBVOPI1GBI510AUGPBFDN826V6GZR" +
                "448NBVOP2BOCAEVSU7BJNFQKQ3V56G0J0CH2WIF0626SV5YJFFYJTM5BGQFIDJAQDF5396OP4TB26QWR" +
                "PBPVA85ZPG31E6C6BS4O19YSLMYTD1N1OPRH0YLXE2BN832G41GA5HDBV7GAAM8NKYHR2ZE6G2HC6QDF" +
                "EYJLDUIO56JUCAFXAALY6UHJ42YHMCK6N7ZYOU7C12LWVQ0WY1ZAEG9917KHZ32RYLYR64ORZXNHT3EI" +
                "0KRA9IASSU7ED5OH9JCL82PWONQGDEFVJFGF770EGHE91NWQVOP055FKVJH8463L2FO2V8DO330XJG23" +
                "II4S63B07T5WS8H3J7JLI79Y3HEIA11YST8PK39LSFDBR7DTCJJH4A6HTI4BS5A28FPSH1CFV1RZI09V" +
                "05KJ5VEF8YQN217B8RPNTO6DJOLB19YEJYD49RJXPQK8RSZZZOMSSSLCW63XV1RUF4YOBYL1OMPFEOUT", "D:/DotNETLibs/NEW/");
            return View();
        }
        public ActionResult Viewer()
        {
            return View();
        }
        [HttpPost]
        public void Upload(HttpPostedFileBase fileUpload)
        {
            if (fileUpload == null) { Response.StatusCode = 201; return; }
            ClearDirectory();
            string aPath = AppDomain.CurrentDomain.BaseDirectory + "App_Data/Uploads/";
            if (!Directory.Exists(aPath)) Directory.CreateDirectory(aPath);
            string aFileName = System.IO.Path.GetFileName(fileUpload.FileName);
            string aFullName = System.IO.Path.Combine(aPath, aFileName);
            if (aFileName != null) fileUpload.SaveAs(aFullName);
            JT_Reader aReader = new JT_Reader();
            Models.JTModel.myModel = new ModelData_Model();
            aReader.ReadFile(new Base_UTF16String(aFullName));
            aReader.Transfer(Models.JTModel.myModel);
            ModelData_WriterParameters aParam = new ModelData_WriterParameters();
            GuidGenerateVisitor aGuidGenerator = new GuidGenerateVisitor();
            Models.JTModel.myModel.Accept(aGuidGenerator);
            aParam.SetFileFormat(ModelData_WriterParameters.FileFormatType.Cdxfb);
            aPath = AppDomain.CurrentDomain.BaseDirectory + "Data/Models/cdxfb/";
            if (!Directory.Exists(aPath)) Directory.CreateDirectory(aPath);
            Models.JTModel.myModel.Save(new Base_UTF16String(aPath + "scenegraph.cdxfb"), aParam);
            Models.JTModel.name = aFileName;
            Response.StatusCode = 200;

        }
        public void GetFile(string fullName)
        {
            System.IO.FileStream aStream = new FileStream(AppDomain.CurrentDomain.BaseDirectory + fullName, FileMode.Open);
            BinaryReader aReader = new BinaryReader(aStream);
            byte[] aData = new byte[aStream.Length];
            aReader.Read(aData, 0, (int)aStream.Length);
            Response.OutputStream.Write(aData, 0, (int)aStream.Length);
            aStream.Close();
        }
        private void ClearDirectory()
        {
            var dirInfo = new DirectoryInfo(AppDomain.CurrentDomain.BaseDirectory + "Data/Models/cdxfb/");
            if (dirInfo.Exists)
            {
                foreach (var file in dirInfo.GetFiles())
                    file.Delete();
            }
            dirInfo = new DirectoryInfo(AppDomain.CurrentDomain.BaseDirectory + "App_Data/Uploads/");
            if (dirInfo.Exists)
            {
                foreach (var file in dirInfo.GetFiles())
                    file.Delete();
            }
        }

        [HttpPost]
        public JsonResult GetValidationProp(string[] uuids)
        {
            if(uuids == null)
            {
                Response.StatusCode = 404;
                return Json(null);
            }
            SearchVisitor aFinder = new SearchVisitor(uuids, uuids.Length - 1);
            Models.JTModel.myModel.Accept(aFinder);
            ModelAlgo_ValidationPropertyData aPropertyData = new ModelAlgo_ValidationPropertyData();
            ModelAlgo_ValidationProperty.ComputeValidationProperties(aFinder.Result(), aPropertyData);
            Models.Property aProperty = new Models.Property(aPropertyData, aFinder.CombineTransform());
            return Json(aProperty);
        }
        
        
    }
}