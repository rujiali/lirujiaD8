<?php

/* modules/disqus/templates/disqus-noscript.html.twig */
class __TwigTemplate_de465238a31ee1c34ba483eba1266cd501a5e9a598eeaa03d6d185c620617487 extends Twig_Template
{
    public function __construct(Twig_Environment $env)
    {
        parent::__construct($env);

        $this->parent = false;

        $this->blocks = array(
        );
    }

    protected function doDisplay(array $context, array $blocks = array())
    {
        $tags = array();
        $filters = array();
        $functions = array();

        try {
            $this->env->getExtension('sandbox')->checkSecurity(
                array(),
                array(),
                array()
            );
        } catch (Twig_Sandbox_SecurityError $e) {
            $e->setTemplateFile($this->getTemplateName());

            if ($e instanceof Twig_Sandbox_SecurityNotAllowedTagError && isset($tags[$e->getTagName()])) {
                $e->setTemplateLine($tags[$e->getTagName()]);
            } elseif ($e instanceof Twig_Sandbox_SecurityNotAllowedFilterError && isset($filters[$e->getFilterName()])) {
                $e->setTemplateLine($filters[$e->getFilterName()]);
            } elseif ($e instanceof Twig_Sandbox_SecurityNotAllowedFunctionError && isset($functions[$e->getFunctionName()])) {
                $e->setTemplateLine($functions[$e->getFunctionName()]);
            }

            throw $e;
        }

        // line 10
        echo "<noscript>
  <p>
    <a href=\"";
        // line 12
        echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, (isset($context["url"]) ? $context["url"] : null), "html", null, true));
        echo "\">";
        echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, (isset($context["message"]) ? $context["message"] : null), "html", null, true));
        echo "</a>
  </p>
</noscript>";
    }

    public function getTemplateName()
    {
        return "modules/disqus/templates/disqus-noscript.html.twig";
    }

    public function isTraitable()
    {
        return false;
    }

    public function getDebugInfo()
    {
        return array (  47 => 12,  43 => 10,);
    }
}
/* {#*/
/* /***/
/* * @file*/
/* * Display Suite reset template.*/
/* **/
/* * Available variables:*/
/* * - disqus_message: The linked message to view the comments in Disqus site*/
/* *//* */
/* #}*/
/* <noscript>*/
/*   <p>*/
/*     <a href="{{ url }}">{{ message }}</a>*/
/*   </p>*/
/* </noscript>*/
