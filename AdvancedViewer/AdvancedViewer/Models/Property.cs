using System;
using System.Collections.Generic;

using System.Linq;
using System.Web;
using cadex;

namespace AdvansedViewer.Models
{
    public class Property
    {
       
        public Property (ModelAlgo_ValidationPropertyData theData, ModelData_Transformation theTrsf)
        {
            SurfaceArea = theData.SurfaceArea();
            var aPoint = theData.Centroid().Transformed(theTrsf);
            Centroid = "" + Math.Round((float)aPoint.X(), 3) + ", " +
                Math.Round((float)aPoint.Y(), 3) + ", " + Math.Round((float)aPoint.Z(), 3);
            //FirstAxisOfInertia = theData.FirstAxisOfInertia();
            //ThirdAxisOfInertia = theData.ThirdAxisOfInertia();
            Volume = theData.Volume();
        }
        public double SurfaceArea { get; set; }
        public string Centroid { get; set; }
        //public ModelData_Direction FirstAxisOfInertia { get; set; }
        //public ModelData_Direction ThirdAxisOfInertia { get; set; }
        public double Volume { get; set; }
    }
    //public class XYZ
    //{
    //    public float X, Y, Z;
    //    public XYZ(float X, float Y, float Z)
    //    {
    //        this.X = X;
    //        this.Y = Y;
    //        this.Z = Z;
    //    }
    //    public new string  ToString()
    //    {
    //        return "" + X + ", " + Y + ", " + Z;
    //    }
    //}
}