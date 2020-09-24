using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using cadex;

namespace AdvancedViewer.CAD_API
{
    public class SearchVisitor : ModelData_Model.VoidElementVisitor
    {
        string[] myGuids;
        int myCurrentPos;
        ModelData_SceneGraphElement myResult;
        ModelData_Transformation myTrsf = new ModelData_Transformation();
        public SearchVisitor(string[] theGuids, int theCount)
        {
            myGuids = theGuids;
            myCurrentPos = theCount;
        }
        public override bool VisitEnter(ModelData_Instance theInstance)
        {
            if (myGuids[myCurrentPos] == theInstance.Guid().ToString().ToLower())
            {
                if (myCurrentPos == 0)
                {
                    myResult = theInstance;
                }
                else
                {
                    myTrsf.Multiply(theInstance.Transformation());
                    myCurrentPos--;
                    return true;
                }
            }
            return false;
        }
        public override bool VisitEnter(ModelData_Assembly theAssembly)
        {
            if (myGuids[myCurrentPos] == theAssembly.Guid().ToString().ToLower())
            {
                if (myCurrentPos == 0)
                {
                    myResult = theAssembly;
                }
                else
                {
                    myCurrentPos--;
                    return true;
                }
            }
            return false;
        }
        public override void Apply(ModelData_Part thePart)
        {
            if (myGuids[myCurrentPos] == thePart.Guid().ToString().ToLower())
            {
                myResult = thePart;
            }
        }
        public ModelData_SceneGraphElement Result()
        {
            return myResult;
        }
        public ModelData_Transformation CombineTransform()
        {
            return myTrsf;
        }
    }
}