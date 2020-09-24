using System.Runtime.InteropServices;
using cadex;

namespace AdvancedViewer.CAD_API
{
    public static class CADEX_initializer
    {
        static bool myIsInit = false;

        [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        static extern bool SetDllDirectory(string lpPathName);
        public static bool Init(string theLic, string theDLLDirectoryPath)
        {
            if (myIsInit) return true;
            SetDllDirectory(theDLLDirectoryPath);
            return myIsInit = LicenseManager.Activate(theLic);
        }
    }
}