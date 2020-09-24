using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using cadex;

namespace AdvancedViewer.CAD_API
{
    public class GuidGenerateVisitor : ModelData_Model.VoidElementVisitor
    {

        public override bool VisitEnter(ModelData_Instance theInstance)
        {
            theInstance.AddGuid();
            return true;
        }
        public override bool VisitEnter(ModelData_Assembly theAssembly)
        {
            theAssembly.AddGuid();
            return true;
        }
        public override void Apply(ModelData_Part thePart)
        {
            thePart.AddGuid();
        }
    }
}